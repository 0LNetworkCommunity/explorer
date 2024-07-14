import os from 'node:os';
import path, { basename } from 'node:path';
import util from 'node:util';
import { execFile as execFileNative } from 'node:child_process';
import { writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

import { OlService } from './ol.service.js';
import { cleanUp } from '../utils.js';
import { S3Service } from '../s3/s3.service.js';
import { NotPendingTransaction } from './types.js';

const execFile = util.promisify(execFileNative);

export interface VersionBatchJobData {
  index: number;
}

@Processor('ol-version-batch')
export class OlVersionBatchProcessor extends WorkerHost implements OnModuleInit {
  public static TRANSACTIONS_PER_REQUEST = 100;

  public static BATCH_SIZE = 100;

  public static isLastVersionOfBatch(version: number): boolean {
    return (
      version %
        (OlVersionBatchProcessor.TRANSACTIONS_PER_REQUEST * OlVersionBatchProcessor.BATCH_SIZE) ===
      (OlVersionBatchProcessor.TRANSACTIONS_PER_REQUEST - 1) * OlVersionBatchProcessor.BATCH_SIZE
    );
  }

  public static getBatchIndex(version: number): number {
    if (version === 0) {
      return 0;
    }
    return Math.floor(
      (version - 1) /
        ((OlVersionBatchProcessor.TRANSACTIONS_PER_REQUEST - 1) *
          OlVersionBatchProcessor.BATCH_SIZE),
    );
  }

  private static getMinMax(transactions: NotPendingTransaction[]): [number, number] | null {
    const { length } = transactions;
    if (!length) {
      return null;
    }

    let min = parseInt(transactions[0].version, 10);
    let max = parseInt(transactions[0].version, 10);

    for (let i = 1; i < length; ++i) {
      const transaction = transactions[i];
      const version = parseInt(transaction.version, 10);
      if (version < min) {
        min = version;
      }
      if (version > max) {
        max = version;
      }
    }

    return [min, max];
  }

  private static getIndexDir(index: number): string {
    const from =
      index * OlVersionBatchProcessor.BATCH_SIZE * OlVersionBatchProcessor.TRANSACTIONS_PER_REQUEST;
    const to =
      from +
      (OlVersionBatchProcessor.TRANSACTIONS_PER_REQUEST - 1) * OlVersionBatchProcessor.BATCH_SIZE;
    return `${from}-${to}`;
  }

  public constructor(
    private readonly s3Service: S3Service,
    private readonly olService: OlService,

    @InjectQueue('ol-version-batch')
    private readonly olVersionBatchQueue: Queue,
  ) {
    super();
  }

  public async onModuleInit() {
    await this.olVersionBatchQueue.add('getMissingBatchTransactions', undefined, {
      repeat: {
        every: 30 * 60 * 1_000, // 30 minutes
      },
    });
  }

  public async process(job: Job<VersionBatchJobData, any, string>) {
    switch (job.name) {
      case 'batch':
        {
          const { index } = job.data;
          await this.processVersionBatch(job, index);
        }
        break;

      case 'getMissingBatchTransactions':
        await this.getMissingBatchTransactions();
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }

  public async processVersionBatch(job: Job<VersionBatchJobData, any, string>, index: number) {
    const archivePath = await this.fetchTransactions(job, index);
    const dest = `transactions/${path.basename(archivePath)}`;

    job.log(`uploading ${dest}`);
    await this.s3Service.upload(archivePath, `transactions/${basename(archivePath)}`);
    job.log(`uploaded ${dest}`);

    await cleanUp(path.dirname(archivePath));
    await job.updateProgress(100);
  }

  private async fetchTransactions(job: Job<VersionBatchJobData, any, string>, index: number) {
    const batchMinMax = [-1, -1];

    const from =
      index * OlVersionBatchProcessor.BATCH_SIZE * OlVersionBatchProcessor.TRANSACTIONS_PER_REQUEST;
    const indexDir = OlVersionBatchProcessor.getIndexDir(index);
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'transactions-batch-'));
    const destDir = path.join(tmpDir, indexDir);
    await mkdir(destDir, { recursive: true });

    for (let i = 0; i < OlVersionBatchProcessor.BATCH_SIZE; ++i) {
      const start = i * OlVersionBatchProcessor.TRANSACTIONS_PER_REQUEST + from;

      const transactions = await this.olService.aptosClient.getTransactions({
        start,
        limit: OlVersionBatchProcessor.TRANSACTIONS_PER_REQUEST,
      });
      const notPendingTransactions = transactions.filter(
        (tx) => tx.type !== 'pending_transaction',
      ) as NotPendingTransaction[];

      if (transactions.length !== OlVersionBatchProcessor.TRANSACTIONS_PER_REQUEST) {
        throw new Error('missing transactions');
      }

      const minMax = OlVersionBatchProcessor.getMinMax(notPendingTransactions);
      if (minMax === null) {
        throw new Error('unable to determine min/max');
      }

      const [min, max] = minMax;

      if (i === 0) {
        batchMinMax[0] = min;
      } else if (i === OlVersionBatchProcessor.BATCH_SIZE - 1) {
        batchMinMax[1] = max;
      }

      await writeFile(path.join(destDir, `${min}-${max}.json`), JSON.stringify(transactions));

      await job.updateProgress((i * 90) / OlVersionBatchProcessor.BATCH_SIZE);
    }

    const archivePath = path.join(tmpDir, `${indexDir}.tgz`);

    await this.compress(destDir, archivePath);
    await cleanUp(destDir);

    return archivePath;
  }

  private async compress(src: string, dst: string) {
    await execFile('tar', ['czf', dst, '.'], { cwd: src });
  }

  private async getMissingBatchTransactions() {
    const files = await this.s3Service.listFiles(`transactions/`);

    const ledgerInfo = await this.olService.aptosClient.getLedgerInfo();
    const version = parseInt(ledgerInfo.ledger_version, 10);

    let expectedFiles = Math.floor(
      Math.floor(version / OlVersionBatchProcessor.TRANSACTIONS_PER_REQUEST) /
        OlVersionBatchProcessor.BATCH_SIZE,
    );

    const indexes: number[] = [];

    for (let i = 0; i < expectedFiles; ++i) {
      const archiveFile = `${OlVersionBatchProcessor.getIndexDir(i)}.tgz`;
      if (!files.includes(archiveFile)) {
        indexes.push(i);
      }
    }

    if (indexes.length) {
      await this.olVersionBatchQueue.addBulk(
        indexes.map((index) => ({
          name: 'batch',
          data: {
            index: index,
          },
          opts: {
            jobId: `__batch__${index}`,
          },
        })),
      );
    }
  }
}
