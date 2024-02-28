import os from "node:os";
import pathUtil from "node:path";
import fs from "node:fs";

import _ from "lodash";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import BN from "bn.js";
import * as d3 from "d3-array";
import axios from "axios";
import Bluebird from "bluebird";
import { Types } from "aptos";
import { ConfigService } from "@nestjs/config";
import qs from "qs";

import { OlDbService } from "../ol-db/ol-db.service.js";
import { ClickhouseService } from "../clickhouse/clickhouse.service.js";
import { TransformerService } from "./transformer.service.js";
import { NotPendingTransaction } from "./types.js";
import { OlConfig } from "../config/config.interface.js";
import { WalletSubscriptionService } from "../wallet-subscription/wallet-subscription.service.js";

const ZERO = new BN(0);
const ONE = new BN(1);

const bnBisect = d3.bisector((a: BN, b: BN) => {
  if (a.lt(b)) {
    return -1;
  }
  if (a.gt(b)) {
    return 1;
  }
  return 0;
});

// Find a BN number in a ascending sorted list
const bnFindIndex = (list: BN[], element: BN): number => {
  const index = bnBisect.center(list, element);
  if (index === -1 || index >= list.length) {
    return -1;
  }
  if (list[index].eq(element)) {
    return index;
  }
  return -1;
};

export interface VersionJobData {
  version: string;
}

@Processor("ol-version")
export class OlVersionProcessor extends WorkerHost implements OnModuleInit {
  private readonly providerHost: string;

  public constructor(
    @InjectQueue("ol-version")
    private readonly olVersionQueue: Queue,

    configService: ConfigService,

    private readonly transformerService: TransformerService,

    private readonly olDbService: OlDbService,

    private readonly clichouseService: ClickhouseService,

    private readonly walletSubscriptionService: WalletSubscriptionService,
  ) {
    super();

    const config = configService.get<OlConfig>("ol")!;
    this.providerHost = config.provider;
  }

  public async onModuleInit() {
    await this.olVersionQueue.add("getMissingVersions", undefined, {
      repeat: {
        every: 8 * 60 * 60 * 1_000, // 8 hours
      },
    });

    await this.olVersionQueue.add("fetchLatestVersion", undefined, {
      repeat: {
        every: 30 * 1_000, // 30 seconds
      },
    });
  }

  public async process(job: Job<VersionJobData, any, string>) {
    switch (job.name) {
      case "getMissingVersions":
        try {
          await Promise.race([
            this.getMissingVersions(),
            // 1m timeout to avoid blocking the queue
            Bluebird.delay(60 * 60 * 1_000),
          ]);
        } catch (error) {
          // fail silently to avoid accumulating failed repeating jobs
        }
        break;

      case "version":
        await this.processVersion(job.data.version);
        break;

      case "fetchLatestVersion":
        try {
          await Promise.race([
            this.fetchLatestVersion(),
            // 1m timeout to avoid blocking the queue
            Bluebird.delay(1 * 60 * 1_000),
          ]);
        } catch (error) {
          // fail silently to avoid accumulating failed repeating jobs
        }
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }

  private async processVersion(version: string) {
    const res = await axios({
      method: "GET",
      url: `${this.providerHost}/v1/transactions?${qs.stringify({
        start: version,
        limit: 1,
      })}`,
      signal: AbortSignal.timeout(5 * 60 * 1_000), // 5 minutes
    });
    const transactions: Types.Transaction[] = res.data;

    if (!transactions.length) {
      throw new Error(`transaction not found ${version}`);
    }
    await this.ingestTransactions(transactions);
  }

  private async fetchLatestVersion() {
    const ledgerVersion = BigInt(await this.getLedgerVersion());

    for (let i = 0; i < 1_000; ++i) {
      const version = ledgerVersion - BigInt(i);
      await this.olVersionQueue.add(
        "version",
        { version: version.toString(10) } as VersionJobData,
        {
          jobId: `__version__${version}`,
        },
      );
    }
  }

  private async ingestTransactions(transactions: Types.Transaction[]) {
    const notPendingTransactions = transactions.filter(
      (transactions) => transactions.type !== "pending_transaction",
    ) as NotPendingTransaction[];
    if (!notPendingTransactions.length) {
      return;
    }

    const dest = await fs.promises.mkdtemp(
      pathUtil.join(os.tmpdir(), "ol-version-"),
    );
    await fs.promises.mkdir(dest, { recursive: true });

    const transactionsFile = `${dest}/transactions.json`;
    await fs.promises.writeFile(
      `${dest}/transactions.json`,
      JSON.stringify(notPendingTransactions),
    );

    const parquetDest = await this.transformerService.transform([
      transactionsFile,
    ]);
    const files = await fs.promises.readdir(parquetDest);
    for (const file of files) {
      await this.clichouseService.insertParquetFile(
        pathUtil.join(parquetDest, file),
      );
    }

    await fs.promises.rm(parquetDest, { recursive: true, force: true });
    await fs.promises.rm(dest, { recursive: true, force: true });

    const versions = notPendingTransactions.map(
      (transaction) => `(${transaction.version})`,
    );

    await this.clichouseService.client.exec({
      query: `
        INSERT INTO "ingested_versions" ("version") VALUES ${versions.join()} 
      `,
    });

    for (const transaction of notPendingTransactions) {
      await this.walletSubscriptionService.releaseVersion(transaction.version);
    }
  }

  private async getLedgerVersion(): Promise<string> {
    const res = await axios({
      method: "GET",
      url: `${this.providerHost}/v1`,
      signal: AbortSignal.timeout(5 * 60 * 1_000), // 5 minutes
    });

    return res.data.ledger_version;
  }

  private async getMissingVersions() {
    const lastBatchIngestedVersion =
      await this.olDbService.getLastBatchIngestedVersion();

    const ingestedVersions = await this.olDbService.getIngestedVersions(
      lastBatchIngestedVersion ?? undefined,
    );
    const latestVersion = new BN(await this.getLedgerVersion());

    for (
      let i = lastBatchIngestedVersion
        ? lastBatchIngestedVersion.add(ONE)
        : ZERO;
      i.lt(latestVersion);
      i = i.add(new BN(ONE))
    ) {
      const version = i;
      if (bnFindIndex(ingestedVersions, version) !== -1) {
        continue;
      }
      await this.olVersionQueue.add(
        "version",
        { version: version.toString(10) } as VersionJobData,
        {
          jobId: `__version__${version}`,
        },
      );
    }
  }
}
