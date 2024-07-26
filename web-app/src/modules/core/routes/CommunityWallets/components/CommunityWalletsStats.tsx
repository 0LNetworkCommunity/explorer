import { FC } from 'react';
import { gql, useQuery } from '@apollo/client';
import StatsCard from '../../../../ui/StatsCard';

const GET_COMMUNITY_WALLETS_STATS = gql`
  query CommunityWalletsStats {
    getCommunityWalletsStats {
      totalPaid
      totalPending
      totalVetoed
      totalBalance
    }
  }
`;

const CommunityWalletsStats: FC = () => {
  const { data } = useQuery(GET_COMMUNITY_WALLETS_STATS);

  return (
    <div className="grid grid-cols-2 gap-[4px] md:grid-cols-3 lg:grid-cols-4 pb-8">
      <StatsCard
        title="Total Balance"
        value={data?.getCommunityWalletsStats.totalBalance?.toLocaleString()}
        loading={!data}
      />
      <StatsCard
        title="Total Paid"
        value={data?.getCommunityWalletsStats.totalPaid?.toLocaleString()}
        loading={!data}
      />
      <StatsCard
        title="Total Pending"
        value={data?.getCommunityWalletsStats.totalPending?.toLocaleString()}
        loading={!data}
      />
      <StatsCard
        title="Total Vetoed"
        value={data?.getCommunityWalletsStats.totalVetoed?.toLocaleString()}
        loading={!data}
      />
    </div>
  );
};

export default CommunityWalletsStats;
