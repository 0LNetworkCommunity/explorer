import { Controller, Get, Inject } from '@nestjs/common';
import { StatsService } from './stats.service.js';
import { Stats } from './types.js';

@Controller('stats')
export class StatsController {
  @Inject()
  private readonly statsService: StatsService;

  @Get()
  public getStats() {
    return this.statsService.getStats();
  }
}
