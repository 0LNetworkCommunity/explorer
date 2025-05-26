import { FC, useEffect, useState } from 'react';
import clsx from 'clsx';
import ReactECharts from 'echarts-for-react';

import useAptos from '../../../../modules/aptos/index';

interface Props {
  address: string;
}

interface AncestryData {
  tree: string[];
}

const Ancestry: FC<Props> = ({ address }) => {
  const [options, setOptions] = useState<any>();
  const [loading, setLoading] = useState(true);
  const aptos = useAptos();

  useEffect(() => {
    const load = async () => {
      try {
        const resources = await aptos.getAccountResources(`0x${address}`);

        // Find the ancestry resource
        const ancestryResource = resources.find(
          (resource) => resource.type === '0x1::ancestry::Ancestry'
        );

        if (!ancestryResource) {
          console.warn('No ancestry data found for this account');
          setLoading(false);
          return;
        }

        const ancestryData = ancestryResource.data as AncestryData;
        const ancestryTree = ancestryData.tree;

        // Create the full ancestry chain including current account
        const fullAncestryChain = [...ancestryTree, address];

        // Get base URL for account links
        const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;

        // Transform data for ECharts graph visualization
        const nodes = fullAncestryChain.map((addr, index) => ({
          name: `${addr.slice(0, 8)}...`,
          value: addr,
          x: index * 100, // Spread horizontally
          y: 0, // All nodes on same Y coordinate
          symbolSize: index === fullAncestryChain.length - 1 ? 12 : 8,
          itemStyle: {
            color: index === fullAncestryChain.length - 1 ? '#5A68FF' : '#9BAEF1',
          },
          label: {
            show: true,
            fontSize: index === fullAncestryChain.length - 1 ? 12 : 10,
            fontWeight: index === fullAncestryChain.length - 1 ? 'bold' : 'normal',
          },
        }));

        const links = fullAncestryChain.slice(0, -1).map((_, index) => ({
          source: index,
          target: index + 1,
          lineStyle: {
            color: '#DAE1FA',
            width: 3,
          },
        }));

        setOptions({
          title: {
            text: 'Account Ancestry',
            left: 'center',
            top: 20,
            textStyle: {
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          series: [
            {
              type: 'graph',
              layout: 'none', // Use fixed positions
              animation: false,
              data: nodes,
              links,
              roam: false,
              lineStyle: {
                color: '#DAE1FA',
                width: 2,
                curveness: 0,
              },
              label: {
                show: true,
                position: 'bottom',
                fontSize: 10,
                color: '#333',
              },
              emphasis: {
                focus: 'adjacency',
                lineStyle: {
                  width: 4,
                },
              },
            },
          ],
          tooltip: {
            formatter: (params: any) => {
              const isCurrentAccount = params.data.value === address;
              return `${isCurrentAccount ? 'Current Account' : 'Ancestor'}: ${params.data.value}${!isCurrentAccount ? '<br/>Click to view account' : ''}`;
            },
          },
        });
      } catch (error) {
        console.error('Failed to load ancestry data:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [address, aptos]);

  // Handle click events on chart nodes
  const onChartClick = (params: any) => {
    // Only allow clicking on ancestor nodes, not the current account
    if (params.data && params.data.value && params.data.value !== address) {
      const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
      const accountUrl = `${baseUrl}/accounts/${params.data.value}`;
      window.open(accountUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="w-full rounded-md shadow overflow-hidden h-[300px] ring-1 ring-black ring-opacity-5 bg-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading ancestry...</div>
        </div>
      </div>
    );
  }

  if (!options) {
    return (
      <div className="w-full rounded-md shadow overflow-hidden h-[300px] ring-1 ring-black ring-opacity-5 bg-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">No ancestry data available</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'w-full rounded-md shadow overflow-hidden h-[300px]',
        'ring-1 ring-black ring-opacity-5',
        'bg-white',
      )}
    >
      <ReactECharts
        option={options}
        style={{ height: '100%', width: '100%' }}
        onEvents={{
          click: onChartClick
        }}
      />
    </div>
  );
};

export default Ancestry;
