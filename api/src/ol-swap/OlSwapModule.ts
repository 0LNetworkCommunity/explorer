import process from 'node:process';

import { BullModule } from '@nestjs/bullmq';
import { Module, Type } from '@nestjs/common';

import { redisConnectionOptions } from '../redis/redis.service.js';

import { ClickhouseModule } from '../clickhouse/clickhouse.module.js';
import { OlSwapProcessor } from './OlSwapProcessor.js';

const roles = process.env.ROLES!.split(',');

const workers: Type<any>[] = [];
if (roles.includes('swap-processor')) {
  workers.push(OlSwapProcessor);
}

@Module({
  imports: [
    ClickhouseModule,

    BullModule.registerQueue({
      name: 'ol-swap',
      // Use redisConnectionOptions instead of redisClient
      connection: redisConnectionOptions,
      // ...other options...
    }),
  ],
  providers: workers,
})
export class OlSwapModule {}
