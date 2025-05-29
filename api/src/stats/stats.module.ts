import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { StatsService } from './stats.service.js';
import { StatsResolver } from './stats.resolver.js';
import { StatsController } from './stats.controller.js';
import { ClickhouseModule } from '../clickhouse/clickhouse.module.js';
import { OlModule } from '../ol/ol.module.js';
import { redisConnectionOptions } from '../redis/redis.service.js';
import loadConfig from '../config/config.js';
import { StatsProcessor } from './stats.processor.js';

// Import new services
import { StatsUtils } from './utils/stats.utils.js';
import { AccountsService } from './services/accounts.service.js';
import { LiquidityService } from './services/liquidity.service.js';
import { TimeSeriesService } from './services/time-series.service.js';
import { TopAccountsService } from './services/top-accounts.service.js';

const config = loadConfig();

@Module({
  imports: [
    ClickhouseModule,
    OlModule,

    BullModule.registerQueue({
      name: 'stats',
      connection: redisConnectionOptions,
    }),
  ],
  providers: [
    StatsService,
    StatsResolver,
    // Add new specialized services
    StatsUtils,
    AccountsService,
    LiquidityService,
    TimeSeriesService,
    TopAccountsService,
    ...(config.cacheEnabled ? [StatsProcessor] : [])
  ],
  exports: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}
