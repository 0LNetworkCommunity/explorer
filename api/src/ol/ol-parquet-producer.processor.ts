import os from 'node:os';
import pathUtil from 'node:path';
import fs from 'node:fs';
import { execFile as execFileNative } from 'node:child_process';
import util from 'node:util';
import { Readable } from 'node:stream';

import Bluebird from "bluebird";
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import _ from 'lodash';
import { OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { S3Service } from '../s3/s3.service.js';
import { cleanUp, createTmpDir } from '../utils.js';
import { TransformerService } from './transformer.service.js';

const execFile = util.promisify(execFileNative);

const PARQUETS_DIR = 'parquets';

@Processor('ol-parquet-producer')
export class OlParquetProducerProcessor
  extends WorkerHost
  implements OnModuleInit
{
  public constructor(
    @InjectQueue('ol-parquet-producer')
    private readonly olParquetProducerQueue: Queue,

    private readonly transformerService: TransformerService,

    private readonly s3Service: S3Service,
  ) {
    super();
  }

  public async onModuleInit() {
    await this.olParquetProducerQueue.add('getMissingFiles', undefined, {
      repeat: {
        every: 30 * 60 * 1_000, // 30 minutes
      },
    });
  }

  public async process(job: Job<any, any, string>) {
    switch (job.name) {
      case 'getMissingFiles':
        await this.getMissingFiles();
        break;

      case 'transform':
        await Promise.race([
          this.processArchive(job),

          // 20m timeout to avoid blocking the queue
          Bluebird.delay(20 * 60 * 1_000).then(() => {
            throw new Error("timeout");
          }),
        ]);
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }

  private async getMissingFiles() {
    const json = (await this.s3Service.listFiles('transactions/')).map(
      (it) => it.split('/')[0].split('.')[0],
    );

    const parquets = (await this.s3Service.listFiles(`${PARQUETS_DIR}/`)).map(
      (it) => it.split('/')[0],
    );

    const missing = _.difference(json, parquets).map((it) =>
      parseInt(it.split('-')[0], 10),
    );

    if (missing.length) {
      await this.olParquetProducerQueue.addBulk(
        missing.map((index) => ({
          name: 'transform',
          data: {
            index,
          },
          opts: {
            jobId: `__transform__${index}`,
          },
        })),
      );
    }
  }

  private async processArchive(job: Job) {
    console.log(`processArchive ${job.data.index}`);

    const start = job.data.index;

    const end = start + 9_900;

    const key = `transactions/${start}-${end}.tgz`;
    job.log(`downloading ${key}`);

    const archivePath = await this.download(key);
    const archiveDir = await this.untar(archivePath);

    const transactionsFiles = (await fs.promises.readdir(archiveDir)).map((file) =>
      pathUtil.join(archiveDir, file),
    );

    const parquetDir = await this.transformerService.transform(transactionsFiles);

    let files = await fs.promises.readdir(parquetDir);
    files = files.filter(
      (it) => it.substring(it.length - '.parquet'.length) === '.parquet',
    );

    for (const file of files) {
      job.log(`compressing (${start}-${end}/${file}.tar.gz) ...`);
      await execFile(
        `tar`,
        [
          'czf',
          `${file}.tar.gz`,
          file,
        ],
        { cwd: parquetDir },
      );

      job.log('uploading');
      await this.s3Service.upload(
        pathUtil.join(parquetDir, `${file}.tar.gz`),
        `${PARQUETS_DIR}/${start}-${end}/${file}.tar.gz`,
      );
      job.log('done');
    }

    await cleanUp(archivePath, archiveDir, parquetDir);
  }

  private async download(key: string): Promise<string> {
    const res = await this.s3Service.download(key);

    const tmpDir = await fs.promises.mkdtemp(
      pathUtil.join(os.tmpdir(), 'parquet-producer-'),
    );
    const dest = pathUtil.join(tmpDir, pathUtil.basename(key));

    return new Promise<string>((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      file.on('close', () => {
        resolve(dest);
      });

      file.on('error', (err) => {
        console.error(err);
        reject(err);
      });

      (res.Body as Readable).pipe(file);
    });
  }

  private async untar(filepath: string): Promise<string> {
    const dest = await createTmpDir();
    await execFile('tar', ['xf', filepath], { cwd: dest });
    return dest;
  }
}