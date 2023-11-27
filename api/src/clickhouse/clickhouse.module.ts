import { Module } from '@nestjs/common';
import { ClickhouseService } from './clickhouse.service.js';

@Module({
  providers: [ClickhouseService],
  exports: [ClickhouseService]
})
export class ClickhouseModule {}
