import { Injectable } from '@nestjs/common';
import BN from 'bn.js';
import {
  ClickhouseQueryResponse,
  ClickhouseService,
} from '../clickhouse/clickhouse.service.js';

export interface PaymentV5 {
  version: BN;
  timestampUsecs: BN;
  amount: BN;
  currency: string;
  sender: Buffer;
  receiver: Buffer;
  metadata: Buffer;
}

type PaymentsDbRawResponseV5 = ClickhouseQueryResponse<{
  version: string;
  timestamp_usecs: string;
  amount: string;
  currency: string;
  sender_hex: string;
  receiver_hex: string;
  metadata_hex: string;
}>;

type UserTransactionsDbRawResponseV5 = ClickhouseQueryResponse<{
  version: string;
  timestamp_usecs: string;
  sender_hex: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  gas_currency: string;
  module_address_hex: string;
  module_name: string;
  function_name: string;
  arguments_hex: string[];
  vm_status: string;
  gas_used: string;
}>;

type ProposedBlocksDbRawResponseV5 = ClickhouseQueryResponse<{
  version: string;
  timestamp_usecs: string;
  round: string;
  proposer_hex: string;
  proposed_time: string;
  gas_used: string;
}>;

export interface UserTransactionV5 {
  version: BN;
  timestampUsecs: BN;
  sender: Buffer;
  sequenceNumber: BN;
  maxGasAmount: BN;
  gasUnitPrice: BN;
  gasCurrency: string;
  moduleAddress: Buffer;
  moduleName: string;
  functionName: string;
  arguments: Buffer[];
  vmStatus: string;
  gasUsed: BN;
}

export interface ProposedBlockV5 {
  version: BN;
  timestampUsecs: BN;
  round: BN;
  proposer: Buffer;
  proposedTime: BN;
  gasUsed: BN;
}

@Injectable()
export class OlDbService {
  private static proposedBlockMapperV5(
    response: ProposedBlocksDbRawResponseV5,
  ): ProposedBlockV5[] {
    return response.data.map((row) => ({
      version: new BN(row.version),
      timestampUsecs: new BN(row.timestamp_usecs),
      round: new BN(row.round),
      proposer: Buffer.from(row.proposer_hex, "hex"),
      proposedTime: new BN(row.proposed_time),
      gasUsed: new BN(row.gas_used),
    }));
  }

  private static paymentMapperV5(
    response: PaymentsDbRawResponseV5,
  ): PaymentV5[] {
    return response.data.map((row) => ({
      version: new BN(row.version),
      timestampUsecs: new BN(row.timestamp_usecs),
      amount: new BN(row.amount),
      currency: row.currency,
      sender: Buffer.from(row.sender_hex, "hex"),
      receiver: Buffer.from(row.receiver_hex, "hex"),
      metadata: Buffer.from(row.metadata_hex, "hex"),
    }));
  }

  private static transactionMapperV5(
    response: UserTransactionsDbRawResponseV5,
  ): UserTransactionV5[] {
    return response.data.map((row) => ({
      version: new BN(row.version),
      timestampUsecs: new BN(row.timestamp_usecs),
      sender: Buffer.from(row.sender_hex, "hex"),
      sequenceNumber: new BN(row.sequence_number),
      maxGasAmount: new BN(row.max_gas_amount),
      gasUnitPrice: new BN(row.gas_unit_price),
      gasCurrency: row.gas_currency,
      moduleAddress: Buffer.from(row.module_address_hex, "hex"),
      moduleName: row.module_name,
      functionName: row.function_name,
      arguments: row.arguments_hex.map((it) => Buffer.from(it, "hex")),
      vmStatus: row.vm_status,
      gasUsed: new BN(row.gas_used),
    }));
  }

  public constructor(private readonly clichouseService: ClickhouseService) {}

  public async getReceivedPaymentsV5(receiver: Buffer): Promise<PaymentV5[]> {
    const resultSet = await this.clichouseService.client.query({
      query: `
        SELECT
          "version", "timestamp_usecs", "amount", "currency", 
          hex("sender") as "sender_hex", hex("receiver") as "receiver_hex",
          hex("metadata") as "metadata_hex"
        FROM "received_payment"
        WHERE
          "receiver" = unhex('${receiver.toString("hex")}')
      `,
      format: "JSON",
    });
    const res = await resultSet.json<PaymentsDbRawResponseV5>();
    return OlDbService.paymentMapperV5(res);
  }

  public async getSentPaymentsV5(sender: Buffer): Promise<PaymentV5[]> {
    const resultSet = await this.clichouseService.client.query({
      query: `
        SELECT
          "version", "timestamp_usecs", "amount", "currency", 
          hex("sender") as "sender_hex", hex("receiver") as "receiver_hex",
          hex("metadata") as "metadata_hex"
        FROM "sent_payment"
        WHERE
          "sender" = unhex('${sender.toString("hex")}')
      `,
      format: "JSON",
    });
    const res = await resultSet.json<PaymentsDbRawResponseV5>();
    return OlDbService.paymentMapperV5(res);
  }

  public async getProposedBlocksB5(proposer: Buffer): Promise<any> {
    const resultSet = await this.clichouseService.client.query({
      query: `
        SELECT
          "version",
          "timestamp_usecs",
          "round",
          hex("proposer") as "proposer_hex",
          "proposed_time",
          "gas_used"
        FROM "new_block"
        WHERE "proposer" = unhex('${proposer.toString("hex")}');
      `,
      format: "JSON",
    });
    const res = await resultSet.json<ProposedBlocksDbRawResponseV5>();
    return OlDbService.proposedBlockMapperV5(res);
  }

  public async getTransactionsV5(sender: Buffer): Promise<UserTransactionV5[]> {
    const resultSet = await this.clichouseService.client.query({
      query: `
        SELECT
          "version",
          "timestamp_usecs",
          hex("sender") as "sender_hex",
          "sequence_number",
          "max_gas_amount",
          "gas_unit_price",
          "gas_currency",
          hex("module_address") as "module_address_hex",
          "module_name",
          "function_name",
          arrayMap(x -> hex(x), "arguments") as "arguments_hex",
          "vm_status",
          "gas_used"
        FROM "user_transaction"
        WHERE "sender" = unhex('${sender.toString("hex")}');
      `,
      format: "JSON",
    });
    const res = await resultSet.json<UserTransactionsDbRawResponseV5>();
    return OlDbService.transactionMapperV5(res);
  }

  public async getCommunityTransfersV5(
    sender: Buffer,
  ): Promise<UserTransactionV5[]> {
    const resultSet = await this.clichouseService.client.query({
      query: `
        SELECT
          "version",
          "timestamp_usecs",
          hex("sender") as "sender_hex",
          "sequence_number",
          "max_gas_amount",
          "gas_unit_price",
          "gas_currency",
          hex("module_address") as "module_address_hex",
          "module_name",
          "function_name",
          arrayMap(x -> hex(x), "arguments") as "arguments_hex",
          "vm_status",
          "gas_used"
        FROM
          "user_transaction"
        WHERE
          "module_name" = 'TransferScripts'
          AND "function_name" = 'community_transfer'
          AND "module_address" = unhex('00000000000000000000000000000001')
          AND "arguments"[1] = unhex('${sender.toString("hex")}')
          AND "sender" != unhex('${sender.toString("hex")}')
      `,
      format: "JSON",
    });
    const res = await resultSet.json<UserTransactionsDbRawResponseV5>();
    return OlDbService.transactionMapperV5(res);
  }

  public async getLastBatchIngestedVersion(): Promise<BN | null> {
    const resultSet = await this.clichouseService.client.query({
      query: `
        SELECT
          max(
            toUInt64(
              splitByChar(
                '-',
                splitByChar('/', name)[1]
              )[2]
            )
          ) AS "last_batch_ingested_version"
        FROM "ingested_files_v7"
      `,
      format: "JSON",
    });
    const res =
      await resultSet.json<
        ClickhouseQueryResponse<{ last_batch_ingested_version: string }>
      >();

    if (!res.rows) {
      return null;
    }

    return new BN(res.data[0].last_batch_ingested_version);
  }

  public async getIngestedVersions(after?: BN): Promise<BN[]> {
    const resultSet = await this.clichouseService.client.query({
      query: `
        SELECT DISTINCT "version"
        FROM "ingested_versions"
        ${after !== undefined ? `WHERE "version" > ${after.toString()}` : ""}
        ORDER BY "version"
      `,
      format: "JSON",
    });
    const res =
      await resultSet.json<ClickhouseQueryResponse<{ version: string }>>();
    return res.data.map((it) => new BN(it.version));
  }
}
