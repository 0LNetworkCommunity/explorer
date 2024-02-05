import { Controller, Get, Inject } from '@nestjs/common';
import { StatsService } from './stats.service.js';
import { Stats } from './types.js';

@Controller('stats')
export class StatsController {
  @Inject()
  private readonly statsService: StatsService;

  @Get()
  public async getStats() {
    const stats: Stats = await this.statsService.getStats();

    // calculate KPIS
    const totalSupply = stats.supplyAndCapital.supplyAllocation.reduce((acc, {value}) => acc + value, 0);
    // circulating
    const circulatingEntry = stats.supplyAndCapital.supplyAllocation.find(entry => entry.name === "Circulating");
    const circulatingValue = circulatingEntry ? circulatingEntry.value : 0;
    const circulatingPercentage = (circulatingValue / totalSupply) * 100;
    const circulatingSupply = {
      nominal: circulatingValue,
      percentage: parseFloat(circulatingPercentage.toFixed(4))
    };

    // CW
    const communityWalletsEntry = stats.supplyAndCapital.supplyAllocation.find(entry => entry.name === "Community Wallets");
    const communityWalletsValue = communityWalletsEntry ? communityWalletsEntry.value : 0;
    const communityWalletsPercentage = (communityWalletsValue / totalSupply) * 100;
    const communityWalletsBalance = {
      nominal: communityWalletsValue,
      percentage: parseFloat(communityWalletsPercentage.toFixed(4))
    };

    // Locked
    const lockedEntry = stats.supplyAndCapital.supplyAllocation.find(entry => entry.name === "Locked");
    const lockedValue = lockedEntry ? lockedEntry.value : 0;
    const lockedPercentage = (lockedValue / totalSupply) * 100;
    const currentLockedOnSlowWallets = {
      nominal: lockedValue,
      percentage: parseFloat(lockedPercentage.toFixed(4))
    };

    const totalBurned = {
      nominal: 100_000_000_000 - totalSupply,
      percentage: (100_000_000_000 - totalSupply) / 100_000_000_000
    };

    const lastEpochTotalUnlockedAmount = {
      nominal: stats.lastEpochTotalUnlockedAmount,
      percentage: (stats.lastEpochTotalUnlockedAmount / totalSupply) * 100
    };

    const lastEpochReward = {
      nominal: stats.pofValues.nominalRewardOverTime[stats.pofValues.nominalRewardOverTime.length - 1].value,
      percentage: (stats.pofValues.nominalRewardOverTime[stats.pofValues.nominalRewardOverTime.length - 1].value / totalSupply) * 100
    };

    return {
      // charts
      slowWalletsCountOverTime: stats.slowWalletsCountOverTime,
      burnOverTime: stats.burnOverTime,
      accountsOnChainOverTime: stats.accountsOnChainOverTime,
      supplyAllocation: stats.supplyAndCapital.supplyAllocation,
      individualsCapital: stats.supplyAndCapital.individualsCapital,
      communityCapital: stats.supplyAndCapital.communityCapital,
      communityWalletsBalanceBreakdown: stats.communityWalletsBalanceBreakdown,
      rewardsOverTime: stats.pofValues.nominalRewardOverTime, // net rewards? also available on the pofValues object
      clearingBidoverTime: stats.pofValues.clearingBidOverTime, // net rewards? also available on the pofValues object
      liquidSupplyConcentration: stats.liquidSupplyConcentration,
      lockedSupplyConcentration: stats.lockedSupplyConcentration,
      
      // kpis
      circulatingSupply,
      totalBurned,
      communityWalletsBalance,
      currentSlowWalletsCount: stats.slowWalletsCountOverTime[stats.slowWalletsCountOverTime.length - 1].value,
      currentLockedOnSlowWallets,
      lastEpochTotalUnlockedAmount,
      lastEpochReward,
      currentClearingBid: (stats.pofValues.clearingBidOverTime[stats.pofValues.clearingBidOverTime.length - 1].value) / 10,
    };
  }
}
