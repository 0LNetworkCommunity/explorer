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
    }

    const lastEpochTotalUnlockedAmount = {
      nominal: stats.lastEpochTotalUnlockedAmount,
      percentage: (stats.lastEpochTotalUnlockedAmount / totalSupply) * 100
    }

    const lastEpochReward = {
      nominal: stats.pofValues.nominalRewardOverTime[stats.pofValues.nominalRewardOverTime.length - 1].value,
      percentage: (stats.pofValues.nominalRewardOverTime[stats.pofValues.nominalRewardOverTime.length - 1].value / totalSupply) * 100
    }


    // return 'ok';
    
    // return stats;
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
      
      // kpis
      circulatingSupply,
      totalBurned,
      communityWalletsBalance,
      currentSlowWalletsCount: stats.slowWalletsCountOverTime[stats.slowWalletsCountOverTime.length - 1].value,
      currentLockedOnSlowWallets,
      lastEpochTotalUnlockedAmount,
      lastEpochReward,
      currentClearingBid: (stats.pofValues.clearingBidOverTime[stats.pofValues.clearingBidOverTime.length - 1].value) / 10,

      

      // unlockedOverTime: [
      //   { timestamp: 1704842008, value: 550000 },
      //   { timestamp: 1704928408, value: 580000 },
      //   { timestamp: 1705014808, value: 600000 },
      //   { timestamp: 1705101208, value: 620000 },
      //   { timestamp: 1705187608, value: 640000 },
      //   { timestamp: 1705274008, value: 650000 },
      //   { timestamp: 1705360408, value: 630000 },
      //   { timestamp: 1705446808, value: 660000 },
      // ],
      circulatingSupplyOverTime: [
        { timestamp: 1705446808, value: 1000000 },
        { timestamp: 1705360408, value: 1050000 },
        { timestamp: 1705274008, value: 1140000 },
        { timestamp: 1705187608, value: 1150000 },
        { timestamp: 1705101208, value: 1200000 },
        { timestamp: 1705014808, value: 1250000 },
        { timestamp: 1704928408, value: 1300000 },
        { timestamp: 1704842008, value: 1350000 },
      ],
      totalSupplyAllocationOverTime: [
        {
          timestamp: 1704842008,
          CommunityWallets: 47.06,
          SlowWallets: 11.76,
          InfrastructureEscrow: 35.29,
          Circulating: 5.88,
        },
        {
          timestamp: 1704928408,
          CommunityWallets: 46.1188,
          SlowWallets: 11.524799999999999,
          InfrastructureEscrow: 34.584199999999996,
          Circulating: 5.7623999999999995,
        },
        {
          timestamp: 1705014808,
          CommunityWallets: 45.196424,
          SlowWallets: 11.294303999999999,
          InfrastructureEscrow: 33.89251599999999,
          Circulating: 5.647151999999999,
        },
        {
          timestamp: 1705101208,
          CommunityWallets: 44.29249552,
          SlowWallets: 11.06841792,
          InfrastructureEscrow: 33.214665679999996,
          Circulating: 5.53420896,
        },
        {
          timestamp: 1705187608,
          CommunityWallets: 43.4066456096,
          SlowWallets: 10.8470495616,
          InfrastructureEscrow: 32.5503723664,
          Circulating: 5.4235247808,
        },
        {
          timestamp: 1705274008,
          CommunityWallets: 42.538512697407995,
          SlowWallets: 10.630108570368,
          InfrastructureEscrow: 31.899364919072,
          Circulating: 5.315054285184,
        },
        {
          timestamp: 1705360408,
          CommunityWallets: 41.68774244345983,
          SlowWallets: 10.417506398960638,
          InfrastructureEscrow: 31.261377620690556,
          Circulating: 5.208753199480319,
        },
      ],
      // communityWalletsBalanceOverTime: [
      //   { timestamp: 1704842008, value: 1000000 },
      //   { timestamp: 1704928408, value: 1050000 },
      //   { timestamp: 1705014808, value: 1100000 },
      //   { timestamp: 1705101208, value: 1150000 },
      //   { timestamp: 1705187608, value: 1200000 },
      // ],
      seatsOverTime: [
        { timestamp: 1704842008, value: 9 },
        { timestamp: 1704928408, value: 9 },
        { timestamp: 1705014808, value: 10 },
        { timestamp: 1705101208, value: 10 },
        { timestamp: 1705187608, value: 11 },
        { timestamp: 1705274008, value: 10 },
        { timestamp: 1705360408, value: 11 },
        { timestamp: 1705446808, value: 12 },
      ],      
      dailyTransactedVolume: {
        "Slow Wallets": [
          { timestamp: 1704842008, value: 1117 },
          { timestamp: 1704928408, value: 1175 },
          { timestamp: 1705014808, value: 1230 },
          { timestamp: 1705101208, value: 1290 },
          { timestamp: 1705187608, value: 1340 },
          { timestamp: 1705274008, value: 1410 },
          { timestamp: 1705360408, value: 1485 },
        ],
        "Circulating Supply": [
          { timestamp: 1704842008, value: 2100 },
          { timestamp: 1704928408, value: 2150 },
          { timestamp: 1705014808, value: 2230 },
          { timestamp: 1705101208, value: 2310 },
          { timestamp: 1705187608, value: 2420 },
          { timestamp: 1705274008, value: 2500 },
          { timestamp: 1705360408, value: 2600 },
        ],
        "Community Wallets": [
          { timestamp: 1704842008, value: 1300 },
          { timestamp: 1704928408, value: 1390 },
          { timestamp: 1705014808, value: 1450 },
          { timestamp: 1705101208, value: 1520 },
          { timestamp: 1705187608, value: 1590 },
          { timestamp: 1705274008, value: 1670 },
          { timestamp: 1705360408, value: 1750 },
        ],
        "System Operations": [
          { timestamp: 1704842008, value: 800 },
          { timestamp: 1704928408, value: 890 },
          { timestamp: 1705014808, value: 970 },
          { timestamp: 1705101208, value: 1030 },
          { timestamp: 1705187608, value: 1100 },
          { timestamp: 1705274008, value: 1180 },
          { timestamp: 1705360408, value: 1250 },
        ],
        categories: [
          "Slow Wallets",
          "Circulating Supply",
          "Community Wallets",
          "System Operations",
        ],
      },
      liquidityConcentrationLiquid: [
        { name: "0 - 250", value: 8491 },
        { name: "251 - 500", value: 393 },
        { name: "501 - 2,500", value: 1211 },
        { name: "2,501 - 5,000", value: 873 },
        { name: "5,001 - 25,000", value: 2404 },
        { name: "25,001 - 50,000", value: 1298 },
        { name: "50,001 - 250,000", value: 2679 },
        { name: "250,001 - 500,000", value: 1036 },
        { name: "500,001 - 2,500,000", value: 617 },
        { name: "2,500,001 - 5,000,000", value: 158 },
        { name: "5,000,001 - 25,000,000", value: 98 },
        { name: "25,000,001 and above", value: 80 },
      ],
      liquidityConcentrationLocked: {
        accountsLocked: [
          { name: "0 - 250", value: 0 },
          { name: "251 - 500", value: 0 },
          { name: "501 - 2,500", value: 0 },
          { name: "2,501 - 5,000", value: 0 },
          { name: "5,001 - 25,000", value: 1 },
          { name: "25,001 - 50,000", value: 4 },
          { name: "50,001 - 250,000", value: 14 },
          { name: "250,001 - 500,000", value: 19 },
          { name: "500,001 - 2,500,000", value: 30 },
          { name: "2,500,001 - 5,000,000", value: 47 },
          { name: "5,000,001 - 25,000,000", value: 41 },
          { name: "25,000,001 and above", value: 20 },
        ],
        avgTotalVestingTime: [
          { name: "0 - 250", value: 0.001 },
          { name: "251 - 500", value: 0.004 },
          { name: "501 - 2,500", value: 0.016 },
          { name: "2,501 - 5,000", value: 0.042 },
          { name: "5,001 - 25,000", value: 0.169 },
          { name: "25,001 - 50,000", value: 0.422 },
          { name: "50,001 - 250,000", value: 1.69 },
          { name: "250,001 - 500,000", value: 4.227 },
          { name: "500,001 - 2,500,000", value: 16.9 },
          { name: "2,500,001 - 5,000,000", value: 42.27 },
          { name: "5,000,001 - 25,000,000", value: 169.0 },
          { name: "25,000,001 and above", value: 460 },
        ],
      },

      changeInCirculatingSupply: { nominal: -25029, percentage: -0.0025 },
      lastEpochBurn: { nominal: 500000, percentage: 0.00005 },
      // communityWalletsChange: { nominal: 600000, percentage: 0.0006 },
      lastEpochRewards: { nominal: 3117, percentage: 0.00003 },
      currentSeatCount: 15,
      currenttimestamp: 17050148086,      
    };
  }
}
