import { Module } from '@nestjs/common';
import { NatsService } from './nats.service.js';

@Module({
  providers: [NatsService],
  exports: [NatsService],
})
export class NatsModule {}
