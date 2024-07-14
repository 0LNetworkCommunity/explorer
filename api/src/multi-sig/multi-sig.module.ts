import { Module } from '@nestjs/common';
import { ClickhouseModule } from '../clickhouse/clickhouse.module.js';
import { MultiSigService } from './multi-sig.service.js';

@Module({
  imports: [ClickhouseModule],
  providers: [MultiSigService],
  exports: [MultiSigService],
})
export class MultiSigModule {}
