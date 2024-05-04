import { Controller, Get, Query, Res, ServiceUnavailableException } from '@nestjs/common';
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
  public async getStats(@Query('q') query: string, @Res() res: Response) {
    res.set('Content-Type', 'application/json');

    // Check if caching is enabled and the query is not present
    if (this.cacheEnabled && !query) {
      const cachedStats = await redisClient.get(STATS_CACHE_KEY);
      if (cachedStats) {
        res.send(cachedStats);
        return;
      }
      throw new ServiceUnavailableException('Cache not ready');
    }

    // Handle specific queries based on the 'q' parameter
    switch (query) {
      case 'circulatingSupply':
        const circulatingSupply = await this.statsService.getCirculatingSupply();
        res.send({ circulatingSupply });
        break;
      case 'totalSupply':
        const totalSupply = await this.statsService.getTotalSupply();
        res.send({ totalSupply });
        break;
      default:
        // Handle the general stats case or no query parameter provided
        const stats = await this.statsService.getStats();
        res.send(stats);
    }
  }
}
