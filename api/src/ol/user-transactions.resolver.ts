import { Args, Int, Query, Resolver } from "@nestjs/graphql";

import {
  GqlUserTransactionDeprecated,
  GqlUserTransactionCollection,
} from "./models/transaction.model.js";
import { ClickhouseService } from "../clickhouse/clickhouse.service.js";

@Resolver()
export class UserTransactionsResolver {
  public constructor(private readonly clickhouseService: ClickhouseService) {}

  @Query(() => Int)
  async userTransactionsCount(): Promise<number> {
    const result = await this.clickhouseService.client
      .query({
        query: 'SELECT COUNT(*) as "total" FROM user_transaction',
        format: "JSONEachRow",
      })
      .then((res) => res.json<{ total: string }[]>());

    // Verifica se o resultado está definido e se contém o campo 'total'
    if (result && result.length > 0) {
      const total = Number(result[0]["total"]);
      return total;
    }

    // Caso não haja resultado, retorna 0 ou lança um erro apropriado
    throw new Error("Failed to fetch user transactions count");
  }

  @Query(() => GqlUserTransactionCollection)
  async userTransactions(
    @Args({ name: "limit", type: () => Int })
    limit: number,

    @Args({ name: "offset", type: () => Int })
    offset: number,

    @Args({ name: "order", type: () => String })
    order: string,
  ): Promise<GqlUserTransactionCollection> {
    const [total, items] = await Promise.all([
      this.clickhouseService.client
        .query({
          query: 'SELECT COUNT(*) as "total" FROM user_transaction',
          format: "JSONEachRow",
        })
        .then((res) => res.json<{ total: string }>())
        .then((rows) => parseInt(rows[0].total, 10)),

      this.clickhouseService.client
        .query({
          query: `
            SELECT
              hex("hash") as "hash",
              "version",
              "gas_used",
              "success",
              "vm_status",
              "sequence_number",
              hex("sender") as "sender",
              "arguments",
              "sequence_number",
              "arguments",
              "max_gas_amount",
              "gas_unit_price",
              "expiration_timestamp",
              hex("module_address") as "module_address",
              "module_name",
              "function_name",
              "timestamp"
            FROM "user_transaction"
            ORDER BY "version" ${order === "ASC" ? "ASC" : "DESC"}
            LIMIT {limit:Int32} OFFSET {offset:Int32}
          `,
          format: "JSONEachRow",
          query_params: {
            limit,
            offset,
          },
        })
        .then((res) =>
          res.json<{
            hash: string;
            version: string;
            gas_used: string;
            success: boolean;
            vm_status: string;
            sender: string;
            sequence_number: string;
            arguments: string;
            max_gas_amount: string;
            gas_unit_price: string;
            expiration_timestamp: string;
            module_address: string;
            module_name: string;
            function_name: string;
            timestamp: string;
          }>(),
        )
        .then((rows) =>
          rows.map(
            (row) =>
              new GqlUserTransactionDeprecated({
                hash: row.hash,
                version: parseInt(row.version, 10),
                gasUsed: parseInt(row.gas_used, 10),
                success: row.success,
                vmStatus: row.vm_status,
                sender: row.sender,
                sequenceNumber: parseInt(row.sequence_number, 10),
                maxGasAmount: parseInt(row.max_gas_amount, 10),
                gasUnitPrice: parseInt(row.gas_unit_price, 10),
                expirationTimestamp: parseInt(row.expiration_timestamp, 10),
                moduleAddress: row.module_address,
                moduleName: row.module_name,
                functionName: row.function_name,
                arguments: row.arguments,
                timestamp: parseInt(row.timestamp, 10),
              }),
          ),
        ),
    ]);

    return new GqlUserTransactionCollection(total, items);
  }
}
