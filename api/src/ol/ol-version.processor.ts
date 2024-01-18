import _ from "lodash";
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { stringify as csvStringify  } from 'csv-stringify/sync';

import BN from 'bn.js';
import * as d3 from 'd3-array';
import { OlService } from './ol.service.js';
import { OlDbService } from '../ol-db/ol-db.service.js';

import { BCS, Types } from 'aptos';
import { ClickhouseService } from '../clickhouse/clickhouse.service.js';
import { NotPendingTransaction } from "./types.js";

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

@Processor("ol-version-v7")
export class OlVersionProcessor extends WorkerHost implements OnModuleInit {
  public constructor(
    @InjectQueue("ol-version-v7")
    private readonly olVersionQueue: Queue,

    private readonly olService: OlService,

    private readonly olDbService: OlDbService,

    private readonly clichouseService: ClickhouseService,
  ) {
    super();
  }

  public async onModuleInit() {
    // const version = "10914227";

    // await this.olVersionQueue.add("version", { version } as VersionJobData, {
    //   jobId: `__version__${version}`,
    // });

    // await this.olVersionQueue.add('getMissingVersions', undefined, {
    //   repeat: {
    //     every: 30 * 1_000, // 30 seconds
    //   },
    // });

    // await this.olVersionQueue.add('fetchLatestVersion', undefined, {
    //   repeat: {
    //     every: 30 * 1_000, // 30 seconds
    //   },
    // });
  }

  public async process(job: Job<VersionJobData, any, string>) {
    switch (job.name) {
      case "getMissingVersions":
        await this.getMissingVersions();
        break;

      case "version":
        await this.processVersion(job.data.version);
        break;

      case "fetchLatestVersion":
        await this.fetchLatestVersion();
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }

  private async processVersion(version: string) {
    const transactions = await this.olService.aptosClient.getTransactions({
      start: parseInt(version, 10),
      limit: 1,
    });

    if (!transactions.length) {
      throw new Error(`transaction not found ${version}`);
    }

    await this.ingestTransaction(transactions[0]);
  }

  private async fetchLatestVersion() {
    const ledgerInfo = await this.olService.aptosClient.getLedgerInfo();

    const version = ledgerInfo.ledger_version;

    await this.olVersionQueue.add("version", { version } as VersionJobData, {
      jobId: `__version__${version}`,
    });
  }

  private async getMissingVersions() {
    const lastBatchIngestedVersion =
      await this.olDbService.getLastBatchIngestedVersion();
    const ingestedVersions = await this.olDbService.getIngestedVersions(
      lastBatchIngestedVersion ?? undefined,
    );
    const ledgerInfo = await this.olService.aptosClient.getLedgerInfo();
    const latestVersion = new BN(ledgerInfo.ledger_version);

    const missingVersions: BN[] = [];
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
      missingVersions.push(version);
    }

    await this.olVersionQueue.addBulk(
      missingVersions.map((version) => ({
        name: "version",
        data: {
          version: version.toString(),
        },
        opts: {
          jobId: `__version__${version}`,
        },
      })),
    );
  }

  private async ingestEvents(
    version: string,
    timestamp: string,
    events: Types.Event[],
  ) {
    const chunks = _.chunk(events, 1_000);
    for (const events of chunks) {
      const payload = csvStringify(
        events.map((event) => {
          const [moduleAddress, moduleName, ...rest] = event.type.split("::");
          const structName = rest.join("::");

          return [
            version,
            timestamp,
            event.guid.creation_number,
            event.guid.account_address.substring(2),
            event.sequence_number,
            moduleAddress.substring(2),
            moduleName,
            structName,
            JSON.stringify(event.data),
          ];
        }),
      );

      const query = `
        INSERT INTO "event_v7" (
          "version",
          "timestamp",
          "creation_number",
          "account_address",
          "sequence_number",
          "module_address",
          "module_name",
          "struct_name",
          "data"
        )
        SELECT
          "version",
          "timestamp",
          "creation_number",
          reinterpretAsUInt256(reverse(unhex("account_address"))),
          "sequence_number",
          reinterpretAsUInt256(reverse(unhex("module_address"))),
          "module_name",
          "struct_name",
          "data"
        FROM
          format(
            CSV,
            $$
              version UInt64,
              timestamp UInt64,
              creation_number UInt64,
              account_address String,
              sequence_number UInt64,
              module_address String,
              module_name String,
              struct_name String,
              data String
            $$,
            $$${payload}$$
          )
      `;

      await this.clichouseService.client.command({
        query,
      });
    }
  }

  private async ingestBlockMetadataTransaction(
    transaction: Types.Transaction_BlockMetadataTransaction,
  ) {
    const libraCoinTotalSupplyChange = transaction.changes.find((it) => {
      const change = it as Types.WriteSetChange_WriteTableItem;
      return (
        change.handle === "0xfc074a2b7638a50ba678ce381a2350a28264f4da004603adb8dc36d125750108" &&
        change.key === "0xa7e1af6d61e958dbefe8f35550aab562f8923634cd7f438bc5190e99ca5fb07c"
      );
    }) as Types.WriteSetChange_WriteTableItem;

    if (libraCoinTotalSupplyChange) {
      const payload = csvStringify([
        [
          '0x1::coin::CoinInfo<0x1::libra_coin::LibraCoin>',
          transaction.version,
          libraCoinTotalSupplyChange.value.substring(2)
        ],
      ]);
      const query = `
        INSERT INTO "coin_total_supply" (
          "coin_type",
          "version",
          "amount"
        )
        SELECT
          "coin_type",
          "version",
          reinterpretAsUInt128(unhex("amount")) 
        FROM
          format(
            CSV,
            $$
              coin_type String,
              version UInt64,
              amount String
            $$,
            $$${payload}$$
        )
      `;

      await this.clichouseService.client.command({
        query,
      });
    }

    const payload = csvStringify([
      [
        transaction.id.substring(2),
        transaction.version,
        transaction.hash.substring(2),
        transaction.epoch,
        transaction.round,
        transaction.previous_block_votes_bitvec,
        transaction.proposer.substring(2),
        JSON.stringify(transaction.failed_proposer_indices),
        transaction.timestamp,
      ],
    ]);

    const query = `
      INSERT INTO "block_metadata_transaction_v7" (
        "id",
        "version",
        "hash",
        "epoch",
        "round",
        "previous_block_votes_bitvec",
        "proposer",
        "failed_proposer_indices",
        "timestamp"
      )
      SELECT
        reinterpretAsUInt256(reverse(unhex("id"))),
        "version",
        reinterpretAsUInt256(reverse(unhex("hash"))),
        "epoch",
        "round",
        unhex("previous_block_votes_bitvec"),
        reinterpretAsUInt256(reverse(unhex("proposer"))),
        "failed_proposer_indices",
        "timestamp"
      FROM
        format(
          CSV,
          $$
            id String,
            version UInt64,
            hash String,
            epoch UInt64,
            round UInt64,
            previous_block_votes_bitvec String,
            proposer String,
            failed_proposer_indices Array(UInt32),
            timestamp UInt64
          $$,
          $$${payload}$$
        )
    `;

    await this.clichouseService.client.command({
      query,
    });
  }

  private async ingestStateCheckpointTransaction(
    transaction: Types.Transaction_StateCheckpointTransaction,
  ) {
    const payload = csvStringify([
      [
        transaction.version,
        transaction.hash.substring(2),
        transaction.state_change_hash.substring(2),
        transaction.event_root_hash.substring(2),
        transaction.state_checkpoint_hash
          ? transaction.state_checkpoint_hash.substring(2)
          : "",
        transaction.gas_used,
        transaction.success,
        transaction.vm_status,
        transaction.accumulator_root_hash.substring(2),
        transaction.timestamp,
      ],
    ]);
    const query = `
      INSERT INTO "state_checkpoint_transaction_v7" (
        "version",
        "hash",
        "state_change_hash",
        "event_root_hash",
        "state_checkpoint_hash",
        "gas_used",
        "success",
        "vm_status",
        "accumulator_root_hash",
        "timestamp"
      )
      SELECT
        "version",
        reinterpretAsUInt256(reverse(unhex("hash"))),
        reinterpretAsUInt256(reverse(unhex("state_change_hash"))),
        reinterpretAsUInt256(reverse(unhex("event_root_hash"))),

        empty("state_checkpoint_hash")
          ? null
          : reinterpretAsUInt256(reverse(unhex("state_checkpoint_hash"))),

        "gas_used",
        "success",
        "vm_status",
        reinterpretAsUInt256(reverse(unhex("accumulator_root_hash"))),
        "timestamp"
      FROM
        format(
          CSV,
          $$
            version UInt64,
            hash String,
            state_change_hash String,
            event_root_hash String,
            state_checkpoint_hash String,
            gas_used UInt64,
            success Boolean,
            vm_status String,
            accumulator_root_hash String,
            timestamp UInt64
          $$,
          $$${payload}$$
        )
    `;

    await this.clichouseService.client.command({
      query,
    });
  }

  private async ingestUserTransaction(transaction: Types.Transaction_UserTransaction) {
    if (transaction.payload.type !== 'entry_function_payload') {
      throw new Error(`unsupported user_transaction payload: ${transaction.payload.type}`);
    }

    const transactionPayload = transaction.payload as Types.EntryFunctionPayload;

    const [moduleAddress, moduleName, ...rest] = transactionPayload.function.split('::');
    const functionName = rest.join('::');

    const payload = csvStringify([
      [
        transaction.version,
        transaction.hash.substring(2),
        transaction.gas_used,
        transaction.success,
        transaction.vm_status,
        transaction.sender.substring(2),
        transaction.sequence_number,
        transaction.max_gas_amount,
        transaction.gas_unit_price,
        transaction.expiration_timestamp_secs,
        moduleAddress.substring(2),
        moduleName,
        functionName,
        JSON.stringify(transactionPayload.type_arguments),
        JSON.stringify(transactionPayload.arguments),
        transaction.payload.type,
        transaction.timestamp,

        // transaction.state_change_hash.substring(2),
        // transaction.event_root_hash.substring(2),
        // transaction.state_checkpoint_hash
        //   ? transaction.state_checkpoint_hash.substring(2)
        //   : "",
        // transaction.accumulator_root_hash.substring(2),

      ],
    ]);
    const query = `
      INSERT INTO "user_transaction_v7" (
        "version",
        "hash",
        "gas_used",
        "success",
        "vm_status",
        "sender",
        "sequence_number",
        "max_gas_amount",
        "gas_unit_price",
        "expiration_timestamp",
        "module_address",
        "module_name",
        "function_name",
        "type_arguments",
        "arguments",
        "type",
        "timestamp"
      )
      SELECT
        "version",
        reinterpretAsUInt256(reverse(unhex("hash"))),
        "gas_used",
        "success",
        "vm_status",
        reinterpretAsUInt256(reverse(unhex("sender"))),
        "sequence_number",
        "max_gas_amount",
        "gas_unit_price",
        "expiration_timestamp",
        reinterpretAsUInt256(reverse(unhex("module_address"))),
        "module_name",
        "function_name",
        "type_arguments",
        "arguments",
        "type",
        "timestamp"
      FROM
        format(
          CSV,
          $$
            version UInt64,
            hash String,
            gas_used UInt64,
            success Boolean,
            vm_status String,
            sender String,
            sequence_number UInt64,
            max_gas_amount UInt64,
            gas_unit_price UInt64,
            expiration_timestamp UInt64,
            module_address String,
            module_name String,
            function_name String,
            type_arguments String,
            arguments String,
            type String,
            timestamp UInt64
          $$,
          $$${payload}$$
        )
    `;

    await this.clichouseService.client.command({
      query,
    });
  }

  private async ingestTransaction(transaction: Types.Transaction) {
    if (transaction.type === "pending_transaction") {
      return;
    }

    switch (transaction.type) {
      case "genesis_transaction":
        {
          const genesisTransaction =
            transaction as Types.Transaction_GenesisTransaction;

          await this.ingestEvents(
            genesisTransaction.version,
            "0",
            genesisTransaction.events,
          );
          genesisTransaction.version;
        }
        break;

      case "block_metadata_transaction":
        {
          const blockMetadataTransaction =
            transaction as Types.Transaction_BlockMetadataTransaction;
          await this.ingestEvents(
            blockMetadataTransaction.version,
            blockMetadataTransaction.timestamp,
            blockMetadataTransaction.events,
          );
          await this.ingestBlockMetadataTransaction(blockMetadataTransaction);
        }
        break;

      case "state_checkpoint_transaction":
        {
          const stateCheckpointTransaction =
            transaction as Types.Transaction_StateCheckpointTransaction;
          await this.ingestStateCheckpointTransaction(
            stateCheckpointTransaction,
          );
        }
        break;

      case "user_transaction": {
        const userTransaction = transaction as Types.Transaction_UserTransaction;

        await this.ingestEvents(
          userTransaction.version,
          userTransaction.timestamp,
          userTransaction.events,
        );

        await this.ingestUserTransaction(userTransaction);
      } break;

      default:
        throw new Error(`Unsupported transaction type ${transaction.type}`);
    }

    await this.clichouseService.client.exec({
      query: `
        INSERT INTO "ingested_versions_v7" ("version") VALUES (${
          (transaction as NotPendingTransaction).version
        })
      `,
    });
  }
}
