import { Module, Type } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { NodeWatcherService } from './node-watcher.service.js';
import { OlModule } from '../ol/ol.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { S3Module } from '../s3/s3.module.js';
import { NodeResolver } from './node.resolver.js';
import RelayController from './relay.controller.js';
import { NodeWatcherProcessor } from './node-watcher.processor.js';
import { redisClient } from '../redis/redis.service.js';

const roles = process.env.ROLES!.split(',');

const workers: Type<any>[] = [];
if (roles.includes('node-watcher')) {
  workers.push(NodeWatcherProcessor);
}

@Module({
  imports: [
    PrismaModule,
    S3Module,
    OlModule,

    BullModule.registerQueue({
      name: 'node-watcher',
      connection: redisClient,
    }),
  ],
  providers: [NodeResolver, NodeWatcherService, ...workers],

  controllers: [RelayController],
  exports: [NodeWatcherService],
})
export class NodeWatcherModule {}
