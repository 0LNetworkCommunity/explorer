import { Controller, Get, Param } from "@nestjs/common";
import { ClickhouseService } from "../clickhouse/clickhouse.service.js";

// Version 0's timestamp is calculated by dedubting the intervation between epoch 2 and 3 to epoch 2's timestamp.
//
// ┌─version─┬────────timestamp─┬─creation_number─┬─account_address─┬─sequence_number─┬─module_address─┬─module_name─────┬─struct_name───┬─data──────────┐
// │       0 │                0 │               2 │               1 │               0 │              1 │ reconfiguration │ NewEpochEvent │ {"epoch":"1"} │
// │       3 │ 1701289679612335 │               2 │               1 │               1 │              1 │ reconfiguration │ NewEpochEvent │ {"epoch":"2"} │
// │  383074 │ 1701376079939922 │               2 │               1 │               2 │              1 │ reconfiguration │ NewEpochEvent │ {"epoch":"3"} │
// └─────────┴──────────────────┴─────────────────┴─────────────────┴─────────────────┴────────────────┴─────────────────┴───────────────┴───────────────┘

// Math.floor((1701289679612335 - (1701376079939922 - 1701289679612335)) / 1_000 / 1_000)

const V0_TIMESTAMP = 1701203279;

@Controller()
export class OlController {
  public constructor(private readonly clickhouseService: ClickhouseService) {}

  @Get("/historical-balance/:address")
  public async historicalBalance(@Param("address") address: string) {
    const query = `
      SELECT
        tupleElement("entry", 2) / 1e6 AS "value",
        tupleElement("entry", 3) AS "time"
      FROM (
        SELECT
          arrayElement(
            arraySort(
              (x) -> tupleElement(x, 1),
              groupArray(
                tuple(
                  "change_index",
                  "balance",
                  ceil("timestamp" / 1e6)
                )
              )
            ),
            -1
          ) AS "entry"
        FROM "coin_balance"
        WHERE "address" = reinterpretAsUInt256(reverse(unhex('${address}')))
        GROUP BY ceil("timestamp" / 1e6)
        ORDER BY ceil("timestamp" / 1e6) ASC
      )
    `;

    const resultSet = await this.clickhouseService.client.query({
      query,
      format: "JSONEachRow",
    });

    const serie: Array<{
      time: number;
      value: number;
    }> = await resultSet.json();

    for (let i = 0; i < serie.length; ++i) {
      const it = serie[i];
      if (it.time === 0) {
        it.time = V0_TIMESTAMP
      } else {
        break;
      }
    }

    return serie;
  }
}
