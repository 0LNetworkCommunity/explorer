import { Module } from '@nestjs/common';
import { ClickhouseModule } from '../clickhouse/clickhouse.module.js';
import { OlDbService } from './ol-db.service.js';

@Module({
  imports: [ClickhouseModule],
  providers: [OlDbService],
  exports: [OlDbService],
})
export class OlDbModule {}
