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
import { TransformerService } from "./transformer.service.js";
import { OlParquetProducerProcessor } from "./ol-parquet-producer.processor.js";
// import { OlClickhouseIngestorProcessor } from "./ol-clickhouse-ingestor.processor.js";
import { OlController } from './ol.controller.js';

const roles = process.env.ROLES!.split(",");

@Module({
  imports: [
    S3Module,
    ClickhouseModule,
    OlDbModule,

    BullModule.registerQueue({
      name: "ol-clickhouse-ingestor",
      connection: redisClient(),
    }),

    BullModule.registerQueue({
      name: "transformer",
      connection: redisClient(),
    }),

    BullModule.registerQueue({
      name: "ol-parquet-producer",
      connection: redisClient(),
    }),

    BullModule.registerQueue({
      name: "ol-version-batch",
      connection: redisClient(),
    }),

    BullModule.registerQueue({
      name: "ol-version",
      connection: redisClient(),
    }),
  ],
  providers: [
    UserTransactionsResolver,
    ModulesResolver,

    AccountResolver,
    AccountsResolver,

    ValidatorResolver,
    ValidatorsResolver,
    VouchResolver,

    OlService,
    TransformerService,

    ...(roles.includes("worker")
      ? [
        OlVersionProcessor,
        OlVersionBatchProcessor,
        OlParquetProducerProcessor,
        // OlClickhouseIngestorProcessor,
      ]
      : []),
  ],
  controllers: [OlController],
  exports: [OlService, TransformerService],
})
export class OlModule {}
