import { Module } from '@nestjs/common';
import { NodeWatcherService } from './node-watcher.service.js';
import { OlModule } from '../ol/ol.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { S3Module } from '../s3/s3.module.js';
import { NodeResolver } from './node.resolver.js';
import RelayController from './relay.controller.js';
import { NodeWatcherProcessor } from './node-watcher.processor.js';
import { BullModule } from '@nestjs/bullmq';
import { redisClient } from '../redis/redis.service.js';

const roles = process.env.ROLES!.split(",");

@Module({
  imports: [
    PrismaModule,
    S3Module,
    OlModule,

    BullModule.registerQueue({
      name: "node-watcher",
      connection: redisClient,
    }),
  ],
  providers: [
    NodeResolver,
    NodeWatcherService,
    ...(roles.includes("worker") ? [NodeWatcherProcessor] : []),
  ],

  controllers: [RelayController],
  exports: [NodeWatcherService],
})
export class NodeWatcherModule {}
