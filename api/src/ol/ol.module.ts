import { BullModule } from '@nestjs/bullmq';
import { Module } from "@nestjs/common";

import { redisClient } from '../redis/redis.service.js';
import { UserTransactionsResolver } from "./user-transactions.resolver.js";
import { ClickhouseModule } from "../clickhouse/clickhouse.module.js";
import { ModulesResolver } from "./modules.resolver.js";
import { OlVersionProcessor } from './ol-version.processor.js';
import { OlService } from "./ol.service.js";

@Module({
  imports: [
    ClickhouseModule,

    BullModule.registerQueue({
      name: 'ol-version-v7',
      connection: redisClient(),
    }),
  ],
  providers: [
    UserTransactionsResolver,
    ModulesResolver,

    OlService,
    OlVersionProcessor
  ],
  controllers: [],
  exports: [OlService],
})
export class OlModule {}
