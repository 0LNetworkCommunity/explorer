import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { StatsService } from './stats.service.js';
import { StatsResolver } from './stats.resolver.js';
import { StatsController } from './stats.controller.js';
import { ClickhouseModule } from '../clickhouse/clickhouse.module.js';
import { OlModule } from '../ol/ol.module.js';
import { redisClient } from '../redis/redis.service.js';
import loadConfig from '../config/config.js';
import { StatsProcessor } from './stats.processor.js';

const config = loadConfig();

@Module({
  imports: [
    ClickhouseModule,
    OlModule,

    BullModule.registerQueue({
      name: 'stats',
      connection: redisClient,
    }),
  ],
  providers: [StatsService, StatsResolver, ...(config.cacheEnabled ? [StatsProcessor] : [])],
  exports: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}
