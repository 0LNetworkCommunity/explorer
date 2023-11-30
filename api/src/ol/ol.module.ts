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

@Module({
  imports: [
    S3Module,
    ClickhouseModule,
    OlDbModule,

    BullModule.registerQueue({
      name: "ol-version-batch-v7",
      connection: redisClient(),
    }),

    BullModule.registerQueue({
      name: "ol-version-v7",
      connection: redisClient(),
    }),
  ],
  providers: [
    UserTransactionsResolver,
    ModulesResolver,

    OlService,
    OlVersionProcessor,
    OlVersionBatchProcessor,
  ],
  controllers: [],
  exports: [OlService],
})
export class OlModule {}
