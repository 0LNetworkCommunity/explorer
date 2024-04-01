import process from "node:process";

import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { redisClient } from "../redis/redis.service.js";
import { ClickhouseModule } from "../clickhouse/clickhouse.module.js";
import { OlSwapProcessor } from "./OlSwapProcessor.js";

const roles = process.env.ROLES!.split(",");

@Module({
  imports: [
    ClickhouseModule,

    BullModule.registerQueue({
      name: "ol-swap",
      connection: redisClient,
    }),
  ],
  providers: roles.includes("worker") ? [OlSwapProcessor] : [],
})
export class OlSwapModule {}
