import { Controller, Get, Res, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

import { StatsService } from './stats.service.js';
import { redisClient } from '../redis/redis.service.js';
import { STATS_CACHE_KEY, ACCOUNTS_STATS_CACHE_KEY } from './constants.js';

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
    res.set('Content-Type', 'application/json');

    // Check if caching is enabled and the query is not present
    if (this.cacheEnabled) {
      const cachedStats = await redisClient.get(STATS_CACHE_KEY);
      if (cachedStats) {
        res.send(JSON.parse(cachedStats));
        return;
      }
      throw new ServiceUnavailableException('Cache not ready');
    }

    const stats = await this.statsService.getStats();
    res.send(stats);
  }

  @Get('/total-supply')
  public async getTotalSupply(@Res() res: Response) {
    const totalSupply = await this.statsService.getTotalSupply();
    res.send({ totalSupply });
  }

  @Get('/circulating-supply')
  public async getCirculatingSupply(@Res() res: Response) {
    const circulatingSupply = await this.statsService.getCirculatingSupply();
    res.send({ circulatingSupply });
  }

  @Get('/accounts-stats')
  public async getAccountsStats(@Res() res: Response) {
    res.set('Content-Type', 'application/json');

    // Check if caching is enabled and the query is not present
    if (this.cacheEnabled) {
      const cachedStats = await redisClient.get(ACCOUNTS_STATS_CACHE_KEY);
      if (cachedStats) {
        res.send(JSON.parse(cachedStats));
        return;
      }
      throw new ServiceUnavailableException('Cache not ready');
    }

    const accountsStats = await this.statsService.getAccountsStats();
    res.send(accountsStats);
  }
}
