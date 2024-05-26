import { Query, Resolver } from "@nestjs/graphql";
import { ClickhouseService } from "../clickhouse/clickhouse.service.js";
import { GqlModule } from "./models/modules.model.js";

@Resolver()
export class ModulesResolver {
  public constructor(private readonly clickhouseService: ClickhouseService) {}

  @Query(() => [GqlModule])
  async modules(): Promise<GqlModule[]> {
    const accountsModules = new Map<string, Map<string, string[]>>();

    const rows = await this.clickhouseService.client
      .query({
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
      })
      .then((res) =>
        res.json<Array<{
          module_address: string;
          module_name: string;
          function_name: string;
        }>>(), // Explicitly typed as an array
      )
      .then((rows) =>
        rows.map((row) => ({
          moduleAddress: row.module_address,
          moduleName: row.module_name,
          functionName: row.function_name,
        })),
      );

    for (const row of rows) {
      let accountModules = accountsModules.get(row.moduleAddress);
      if (!accountModules) {
        accountModules = new Map();
        accountsModules.set(row.moduleAddress, accountModules);
      }

      let accountModule = accountModules.get(row.moduleName);
      if (!accountModule) {
        accountModule = [];
        accountModules.set(row.moduleName, accountModule);
      }
      accountModule.push(row.functionName);
    }

    const res: GqlModule[] = [];

    for (const [address, modules] of accountsModules) {
      for (const [name, functions] of modules) {
        res.push(new GqlModule({ address, name, functions }));
      }
    }

    return res;
  }
}
