import { Inject, Injectable } from "@nestjs/common";
import { Stats } from "./types.js";
import { ClickhouseService } from "../clickhouse/clickhouse.service.js";
import { OlService } from "../ol/ol.service.js";

@Injectable()
export class StatsService {
  @Inject()
  private readonly clickhouseService: ClickhouseService;

  @Inject()
  private readonly olService: OlService;

  public async getStats() {
    const communityWallets = await this.olService.getCommunityWallets();
    console.log(communityWallets);

    // const totalSupply = await this.getTotalSupply();
    // const slowWallets = await this.getSlowWallets();

    // const slowWalletAddresses = slowWallets.map((it) => it.address);

    // const slowWalletBalances = await this.getWalletsBalances(slowWalletAddresses);

    // const slowWalletsMap = new Map(
    //   slowWallets.map((it) => [it.address, it])
    // );
    // const slowWalletBalancesMap = new Map(
    //   slowWalletBalances.map((it) => [it.address, it.balance]),
    // );
    
    // const totalSlowWalletLocked = Array.from(slowWalletBalancesMap.keys()).map(
    //   (address) => {
    //     return (
    //       slowWalletBalancesMap.get(address)! -
    //       slowWalletsMap.get(address)!.unlocked
    //     );
    //   },
    // ).reduce((prev, curr) => prev + curr, 0);

    // return { totalSupply, totalSlowWalletLocked };
  }

  private async getWalletsBalances(addresses: string[]) {
    if (addresses.length === 0) {
      return [];
    }

    const query = `
      SELECT
        tupleElement("entry", 2) / 1e6 AS "balance",
        hex(tupleElement("entry", 3)) AS "address"
        FROM (
          SELECT
            arrayElement(
              arraySort(
                (x) -> tupleElement(x, 1) ,
                groupArray(
                  tuple(
                    "version",
                    "balance",
                    "address"
                  )
                )
              ),
              -1
            ) AS "entry"
          FROM "coin_balance"
          WHERE
            has(
              arrayMap(
                x -> reinterpretAsUInt256(reverse(unhex(x))),
                {addresses: Array(String)}
              ),
              "address" 
            )
          GROUP BY "address"
        )
    `;

    const resultSet = await this.clickhouseService.client.query({
      query,
      query_params: {
        addresses,
      },
      format: "JSONEachRow",
    });
    const rows = await resultSet.json<
      {
        balance: number;
        address: string;
      }[]
    >();

    return rows;
  }

  private async getSlowWallets(): Promise<
    {
      address: string;
      unlocked: number;
      transferred: number;
    }[]
  > {
    const query = `
      SELECT
        hex(tupleElement("entry", 2)) AS "address",
        tupleElement("entry", 3) / 1e6 AS "unlocked",
        tupleElement("entry", 4) / 1e6 AS "transferred"
      FROM (
        SELECT
          arrayElement(
            arraySort(
              (x) -> tupleElement(x, 1) ,
              groupArray(
                tuple(
                  "version",
                  "address",
                  "unlocked",
                  "transferred"
                )
              )
            ),
            -1
          ) AS "entry"
        FROM "slow_wallet"
        GROUP BY "address"
      )
    `;

    const resultSet = await this.clickhouseService.client.query({
      query,
      format: "JSONEachRow",
    });
    const rows = await resultSet.json<
      {
        address: string;
        unlocked: number;
        transferred: number;
      }[]
    >();

    return rows;
  }

  private async getTotalSupply(): Promise<number> {
    const resultSet = await this.clickhouseService.client.query({
      query: `
        SELECT
          "amount" / 1e6 AS "totalSupply"
        FROM "total_supply"
        ORDER BY
          "version" DESC,
          "change_index"
        DESC limit 1
      `,
      format: "JSONEachRow",
    });
    const rows = await resultSet.json<
      {
        totalSupply: number;
      }[]
    >();
    if (!rows.length) {
      return 0;
    }
    return rows[0].totalSupply;
  }
}
