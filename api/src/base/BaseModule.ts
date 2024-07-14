import process from "node:process";
import { BullModule } from "@nestjs/bullmq";
import { Module, Type } from "@nestjs/common";

import { BaseLiveProcessor } from "./BaseLiveProcessor.js";
import { BaseHistoricalProcessor } from "./BaseHistoricalProcessor.js";
import { BaseController } from "./BaseController.js";
import { ClickhouseModule } from "../clickhouse/clickhouse.module.js";
import { redisClient } from "../redis/redis.service.js";

const roles = process.env.ROLES!.split(",");

const workers: Type<any>[] = [];
if (roles.includes("base-live-processor")) {
  // workers.push(BaseLiveProcessor);
}
if (roles.includes("base-historical-processor")) {
  // workers.push(BaseHistoricalProcessor);
}

@Module({
  imports: [
    ClickhouseModule,

    BullModule.registerQueue({
      name: "base-live",
      connection: redisClient,
    }),
    BullModule.registerQueue({
      name: "base-historical",
      connection: redisClient,
    }),
  ],
  controllers: [BaseController],
  providers: [BaseLiveProcessor, BaseHistoricalProcessor, ...workers],
  // providers: [BaseLiveProcessor, ...workers],
})
export class BaseModule {}
