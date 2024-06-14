import { FC, useEffect, useState } from 'react';
import axios from 'axios';

import StatsCard from '../../../../ui/StatsCard';
import { config } from '../../../../../config';

const getData = async () => {
  const res = await axios({
    url: `${config.apiHost}/stats/accounts-stats`,
  });
  return res.data;
};

const AccountsStats: FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getData().then(setData);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-[4px] md:grid-cols-3 lg:grid-cols-4 pb-8">
      <StatsCard
        title="Total Accounts"
        value={data?.totalAccounts?.toLocaleString()}
        loading={!data}
      />
      <StatsCard
        title="24h Active Accounts"
        value={data?.activeAddressesCount?.lastDay?.toLocaleString()}
        loading={!data}
      />
      <StatsCard
        title="30d Active Accounts"
        value={data?.activeAddressesCount?.last30Days?.toLocaleString()}
        loading={!data}
      />
      <StatsCard
        title="90d Active Accounts"
        value={data?.activeAddressesCount?.last90Days?.toLocaleString()}
        loading={!data}
      />
    </div>
  );
};

export default AccountsStats;
