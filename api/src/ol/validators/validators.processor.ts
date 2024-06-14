// src/validators/validators.processor.ts
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue, Job } from "bullmq";
import { redisClient } from "../../redis/redis.service.js";
import { ValidatorsService } from "./validators.service.js";
import { VALIDATORS_CACHE_KEY } from "../constants.js";

@Processor("validators")
export class ValidatorsProcessor extends WorkerHost {
  public constructor(
    @InjectQueue("validators")
    private readonly validatorsQueue: Queue,
    private readonly validatorsService: ValidatorsService,
  ) {
    super();
  }

  public async onModuleInit() {
    await this.validatorsQueue.add("updateValidatorsCache", undefined, {
      repeat: {
        every: 30 * 1000, // 30 seconds
      },
    });

    // Execute the job immediately on startup
    await this.updateValidatorsCache();
  }

  public async process(job: Job<void, any, string>) {
    switch (job.name) {
      case "updateValidatorsCache":
        await this.updateValidatorsCache();
        break;

      default:
        throw new Error(`Invalid job name ${job.name}`);
    }
  }

  private async updateValidatorsCache() {
    const validators = await this.validatorsService.getValidators();
    await redisClient.set(VALIDATORS_CACHE_KEY, JSON.stringify(validators));
  }
}
