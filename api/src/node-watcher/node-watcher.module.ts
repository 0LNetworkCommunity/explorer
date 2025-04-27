import { Module, Type } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { NodeWatcherService } from './node-watcher.service.js';
import { NodeWatcherProcessor } from './node-watcher.processor.js';
import { OlModule } from '../ol/ol.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { S3Module } from '../s3/s3.module.js';
import { NodeResolver } from './node.resolver.js';
import { redisConnectionOptions } from '../redis/redis.service.js';
import { ClickhouseModule } from '../clickhouse/clickhouse.module.js';
import { TransformerService } from '../ol/transformer.service.js';

// Get roles from environment and create worker array conditionally
const roles = process.env.ROLES?.split(',') || [];
const nodeWatcherWorkers: Type<any>[] = [];

if (roles.includes('node-watcher')) {
  nodeWatcherWorkers.push(NodeWatcherProcessor);
}

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'node-watcher',
      connection: redisConnectionOptions,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
    OlModule,
    PrismaModule,
    S3Module,
    ClickhouseModule,
  ],
  providers: [
    NodeResolver,
    NodeWatcherService,
    TransformerService,
    ...nodeWatcherWorkers
  ],
  exports: [NodeWatcherService],
})
export class NodeWatcherModule {}
