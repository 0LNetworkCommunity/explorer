import { Module } from "@nestjs/common";
import { StatsService } from "./stats.service.js";
import { StatsController } from "./stats.controller.js";
import { ClickhouseModule } from "../clickhouse/clickhouse.module.js";
import { OlModule } from "../ol/ol.module.js";

@Module({
  imports: [ClickhouseModule, OlModule],
  providers: [StatsService],
  exports: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}
