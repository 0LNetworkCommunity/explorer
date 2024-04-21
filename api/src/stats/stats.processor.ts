import _ from "lodash";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";

import { StatsService } from "./stats.service.js";
import { redisClient } from "../redis/redis.service.js";
import { STATS_CACHE_KEY } from "./constants.js";

@Processor("stats")
export class StatsProcessor extends WorkerHost implements OnModuleInit {
  public constructor(
    @InjectQueue("stats")
    private readonly statsQueue: Queue,

    private readonly statsService: StatsService,
  ) {
    super();
  }

  public async onModuleInit() {
    await this.statsQueue.add("updateStats", undefined, {
      repeat: {
        every: 60 * 60 * 2 * 1_000, // 2 hours
      },
    });
  }

  public async process(job: Job<void, any, string>) {
    switch (job.name) {
      case "updateStats":
        await this.updateStats();
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }

  private async updateStats() {
    const stats = await this.statsService.getStats();
    await redisClient.set(STATS_CACHE_KEY, JSON.stringify(stats));
  }
}
