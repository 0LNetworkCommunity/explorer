import { Controller, Get, Res, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

import { StatsService } from './stats.service.js';
import { redisClient } from '../redis/redis.service.js';
import { STATS_CACHE_KEY } from './constants.js';

@Controller('stats')
export class StatsController {
  private readonly cacheEnabled: boolean;

  public constructor(
    private readonly statsService: StatsService,
    config: ConfigService,
  ) {
    this.cacheEnabled = config.get<boolean>('cacheEnabled')!;
  }

  @Get()
  public async getStats(@Res() res: Response) {
    if (this.cacheEnabled) {
      const stats = await redisClient.get(STATS_CACHE_KEY);
      if (!stats) {
        throw new ServiceUnavailableException('Cache not ready');
      }

      res.set('Content-Type', 'application/json');
      res.send(stats);
      return;
    }
    return this.statsService.getStats();
  }
}
