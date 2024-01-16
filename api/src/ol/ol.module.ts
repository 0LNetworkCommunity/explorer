import process from "node:process";

import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { redisClient } from "../redis/redis.service.js";
import { UserTransactionsResolver } from "./user-transactions.resolver.js";
import { ClickhouseModule } from "../clickhouse/clickhouse.module.js";
import { ModulesResolver } from "./modules.resolver.js";
import { OlService } from "./ol.service.js";
import { S3Module } from "../s3/s3.module.js";

import { OlVersionBatchProcessor } from "./ol-version-batch.processor.js";
import { OlVersionProcessor } from "./ol-version.processor.js";
import { OlDbModule } from "../ol-db/ol-db.module.js";
import { ValidatorsResolver } from "./validators.resolver.js";
import { ValidatorResolver } from "./validator.resvoler.js";
import { AccountResolver } from "./account.resolver.js";
import { VouchResolver } from "./vouch.resolver.js";
import { AccountsResolver } from "./accounts.resolver.js";
import { SystemInfoResolver } from "./system-info.resolver.js";

const roles = process.env.ROLES!.split(",");

@Module({
  imports: [
    S3Module,
    ClickhouseModule,
    OlDbModule,

    ...(roles.includes("worker")
      ? [
          BullModule.registerQueue({
            name: "ol-version-batch-v7",
            connection: redisClient(),
          }),

          BullModule.registerQueue({
            name: "ol-version-v7",
            connection: redisClient(),
          }),
        ]
      : []),
  ],
  providers: [
    UserTransactionsResolver,
    ModulesResolver,

    AccountResolver,
    AccountsResolver,

    ValidatorResolver,
    ValidatorsResolver,
    VouchResolver,
    SystemInfoResolver,

    OlService,

    ...(roles.includes("worker")
      ? [OlVersionProcessor, OlVersionBatchProcessor]
      : []),
  ],
  controllers: [],
  exports: [OlService],
})
export class OlModule {}
