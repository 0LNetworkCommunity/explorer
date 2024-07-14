import { Injectable } from '@nestjs/common';
import { ClickhouseService } from '../../clickhouse/clickhouse.service.js';
import { OlService } from '../ol.service.js';
import { communityWallets } from '../community-wallets/community-wallets.js';
import { CumulativeShare, TopAccount } from './accounts.model.js';

@Injectable()
export class AccountsService {
  constructor(
    private readonly clickhouseService: ClickhouseService,
    private readonly olService: OlService,
  ) {}

  public async getTopBalanceAccounts(limit: number): Promise<TopAccount[]> {
    try {
      const supplyStats = await this.olService.getSupplyStats();
      const totalSupply = supplyStats.totalSupply;

      const query = `
        SELECT
          ROW_NUMBER() OVER (ORDER BY balance DESC) AS rank,
          address,
          balance
        FROM (
          SELECT
            hex(address) AS address,
            max(balance) / 1e6 AS balance
          FROM coin_balance
          WHERE coin_module = 'libra_coin'
          GROUP BY address
        )
        ORDER BY balance DESC
        LIMIT ${limit}
      `;

      const resultSet = await this.clickhouseService.client.query({
        query: query,
        format: 'JSONEachRow',
      });

      const rows: Array<{
        rank: number;
        address: string;
        balance: number;
        publicName: string;
      }> = await resultSet.json();

      let cumulativeBalanceAmount = 0;
      const accountsWithCumulative = rows.map((account) => {
        const name = communityWallets.get(account.address)?.name;
        account.publicName = name ?? '';
        cumulativeBalanceAmount += account.balance;
        const cumulativeShare = new CumulativeShare({
          amount: cumulativeBalanceAmount,
          percentage: (cumulativeBalanceAmount / totalSupply) * 100,
        });
        return new TopAccount({
          ...account,
          cumulativeShare,
        });
      });

      return accountsWithCumulative;
    } catch (error) {
      console.error('Error in getTopBalanceAccounts:', error);
      throw error;
    }
  }
}
