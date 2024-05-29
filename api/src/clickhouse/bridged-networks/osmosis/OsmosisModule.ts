import process from "node:process";
import { BullModule } from "@nestjs/bullmq";
import { Module, Type } from "@nestjs/common";

import { redisClient } from "../../../redis/redis.service.js";
import { ClickhouseModule } from "../../clickhouse.module.js";
import { OsmosisLiveProcessor } from "./OsmosisLiveProcessor.js";
import { OsmosisHistoricalProcessor } from "./OsmosisHistoricalProcessor.js";
import { OsmosisController } from './osmosis.controller.js';

const roles = process.env.ROLES!.split(",");

const workers: Type<any>[] = [];
if (roles.includes("osmosis-live-processor")) {
  workers.push(OsmosisLiveProcessor);
}
if (roles.includes("osmosis-historical-processor")) {
  workers.push(OsmosisHistoricalProcessor);
}

@Module({
  imports: [
    ClickhouseModule,

    BullModule.registerQueue({
      name: "osmosis-live",
      connection: redisClient,
    }),
    BullModule.registerQueue({
      name: "osmosis-historical",
      connection: redisClient,
    }),
  ],
  controllers: [OsmosisController],
  providers: [OsmosisLiveProcessor, OsmosisHistoricalProcessor, ...workers],
})
export class OsmosisModule {}