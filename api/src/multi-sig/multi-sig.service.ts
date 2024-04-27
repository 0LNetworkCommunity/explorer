import { Injectable, OnModuleInit } from "@nestjs/common";
import { ClickhouseService } from "../clickhouse/clickhouse.service.js";

@Injectable()
export class MultiSigService implements OnModuleInit {
  public constructor(private readonly clickhouseService: ClickhouseService) {}

  public async onModuleInit() {
    console.log("InitMultiSigService");
    setTimeout(async () => {
      const res = await this.clickhouseService.client.query({
        query: `
          SELECT * FROM "multi_action" LIMIT 10
        `,
      });
      const rows = await res.json();
      console.log(rows);
    }, 3_000);
  }
}