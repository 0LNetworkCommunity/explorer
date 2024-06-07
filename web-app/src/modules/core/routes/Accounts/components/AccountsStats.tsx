import { FC, useEffect, useState } from 'react';
import StatsCard from '../../../../ui/StatsCard';

const AccountsStats: FC = () => {
  const [stats, setStats] = useState<{
    totalAccounts: string | null;
    dailyActiveAccounts: string | null;
    monthlyActiveAccounts: string | null;
    quarterActiveAccounts: string | null;
  }>({
    totalAccounts: null,
    dailyActiveAccounts: null,
    monthlyActiveAccounts: null,
    quarterActiveAccounts: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock function to fetch data, replace with actual data fetching logic
    const fetchStats = async () => {
      setLoading(true);
      const fetchedStats = await fetchDataFromAPI();
      setStats(fetchedStats);
      setLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-[4px] md:grid-cols-3 lg:grid-cols-4 pb-8">
      <StatsCard title="Total Accounts" value={stats.totalAccounts} loading={loading} />
      <StatsCard
        title="Daily Active Accounts"
        value={stats.dailyActiveAccounts}
        loading={loading}
      />
      <StatsCard
        title="30d Active Accounts"
        value={stats.monthlyActiveAccounts}
        loading={loading}
      />
      <StatsCard
        title="90d Active Accounts"
        value={stats.quarterActiveAccounts}
        loading={loading}
      />
    </div>
  );
};

// Mock function to fetch data, replace with actual data fetching logic
const fetchDataFromAPI = async () => {
  // Simulate data fetching delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    totalAccounts: (51234).toLocaleString(),
    dailyActiveAccounts: (1500).toLocaleString(),
    monthlyActiveAccounts: (5000).toLocaleString(),
    quarterActiveAccounts: (10000).toLocaleString(),
  };
};

export default AccountsStats;
