import { Module } from "@nestjs/common";
import { UserTransactionsResolver } from "./user-transactions.resolver.js";
import { ClickhouseModule } from "../clickhouse/clickhouse.module.js";
import { ModulesResolver } from "./modules.resolver.js";

@Module({
  imports: [ClickhouseModule],
  providers: [UserTransactionsResolver, ModulesResolver],
  controllers: [],
  exports: [],
})
export class OlModule {}
