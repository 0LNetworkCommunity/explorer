import { Query, Resolver } from "@nestjs/graphql";

import { ClickhouseService } from "../clickhouse/clickhouse.service.js";
import { GqlModule } from "./models/modules.model.js";

@Resolver()
export class ModulesResolver {
  public constructor(private readonly clickhouseService: ClickhouseService) {}

  @Query(() => [GqlModule])
  async modules(): Promise<GqlModule[]> {
    const accountsModules = new Map<string, Map<string, string[]>>();

    const resultSet = await this.clickhouseService.client.query({
      query: `
        SELECT
          hex("module_address") as "module_address",
          "module_name",
          "function_name"
        FROM
          "user_transaction_v7"
        GROUP BY
          "module_address",
          "module_name",
          "function_name"
      `,
      format: "JSONEachRow",
    });

    const rows = await resultSet.json<{
      module_address: string;
      module_name: string;
      function_name: string;
    }[]>();

    rows.forEach((row) => {
      let accountModules = accountsModules.get(row.module_address);
      if (!accountModules) {
        accountModules = new Map();
        accountsModules.set(row.module_address, accountModules);
      }

      let accountModule = accountModules.get(row.module_name);
      if (!accountModule) {
        accountModule = [];
        accountModules.set(row.module_name, accountModule);
      }
      accountModule.push(row.function_name);
    });

    const res: GqlModule[] = [];

    for (const [address, modules] of accountsModules) {
      for (const [name, functions] of modules) {
        res.push(new GqlModule({ address, name, functions }));
      }
    }

    return res;
  }
}
