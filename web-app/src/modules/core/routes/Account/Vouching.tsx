import { FC, useEffect, useState } from 'react';
import clsx from 'clsx';
import ReactECharts from 'echarts-for-react';

import useAptos from '../../../../modules/aptos/index';

interface Props {
  address: string;
}

interface GivenVouchesData {
  epoch_vouched: string[];
  outgoing_vouches: string[];
}

interface ReceivedVouchesData {
  epoch_vouched: string[];
  incoming_vouches: string[];
}

const Vouching: FC<Props> = ({ address }) => {
  const [options, setOptions] = useState<any>();
  const [loading, setLoading] = useState(true);
  const aptos = useAptos();

  useEffect(() => {
    const load = async () => {
      try {
        const resources = await aptos.getAccountResources(`0x${address}`);

        // Find vouching resources
        const givenVouchesResource = resources.find(
          (resource) => resource.type === '0x1::vouch::GivenVouches'
        );
        const receivedVouchesResource = resources.find(
          (resource) => resource.type === '0x1::vouch::ReceivedVouches'
        );

        if (!givenVouchesResource && !receivedVouchesResource) {
          setLoading(false);
          return;
        }

        const givenVouches = givenVouchesResource?.data as GivenVouchesData | undefined;
        const receivedVouches = receivedVouchesResource?.data as ReceivedVouchesData | undefined;

        // Build the vouching network
        const nodes: any[] = [];
        const links: any[] = [];

        // Add current account as root node
        nodes.push({
          id: 0,
          name: `Current\n${address.slice(0, 8)}...`,
          value: address,
          symbolSize: 15,
          itemStyle: {
            color: '#5A68FF',
          },
          category: 0,
          draggable: false, // Current account is not draggable
        });

        let nodeIndex = 1;

        // Add incoming vouches
        if (receivedVouches?.incoming_vouches) {
          receivedVouches.incoming_vouches.forEach((voucherAddress, index) => {
            const epoch = receivedVouches.epoch_vouched?.[index] || 'Unknown';

            nodes.push({
              id: nodeIndex,
              name: `Voucher\n${voucherAddress.slice(0, 8)}...`,
              value: voucherAddress,
              epoch: epoch,
              symbolSize: 10,
              itemStyle: {
                color: '#10B981', // Green for incoming vouchers
              },
              category: 1,
              draggable: true,
            });

            links.push({
              source: nodeIndex,
              target: 0,
            });

            nodeIndex++;
          });
        }

        // Add outgoing vouches
        if (givenVouches?.outgoing_vouches) {
          givenVouches.outgoing_vouches.forEach((voucheeAddress, index) => {
            const epoch = givenVouches.epoch_vouched?.[index] || 'Unknown';

            nodes.push({
              id: nodeIndex,
              name: `Vouchee\n${voucheeAddress.slice(0, 8)}...`,
              value: voucheeAddress,
              epoch: epoch,
              symbolSize: 8,
              itemStyle: {
                color: '#F59E0B', // Orange for outgoing vouchees
              },
              category: 2,
              draggable: true,
            });

            links.push({
              source: 0,
              target: nodeIndex,
            });

            nodeIndex++;
          });
        }

        if (nodes.length === 1) {
          setLoading(false);
          return;
        }

        setOptions({
          title: {
            text: 'Vouching Network',
            left: 'center',
            top: 20,
            textStyle: {
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          tooltip: {
            formatter: (params: any) => {
              const category = params.data.category;
              const epoch = params.data.epoch;
              let roleText;

              if (category === 1) {
                roleText = 'Voucher for current account';
              } else if (category === 2) {
                roleText = 'Vouched by current account';
              } else {
                roleText = 'Current Account';
              }

              const epochInfo = category !== 0 && epoch ? `<br/>Epoch: ${epoch}` : '';
              const clickInfo = category !== 0 ? '<br/>Click to view account' : '';

              return `${roleText}<br/>Address: ${params.data.value}${epochInfo}${clickInfo}`;
            },
          },
          legend: {
            data: [
              { name: 'Current Account', itemStyle: { color: '#5A68FF' } },
              { name: 'Vouchers', itemStyle: { color: '#10B981' } },
              { name: 'Vouchees', itemStyle: { color: '#F59E0B' } }
            ],
            bottom: 10,
          },
          series: [
            {
              type: 'graph',
              layout: 'force',
              data: nodes,
              links,
              categories: [
                { name: 'Current Account', itemStyle: { color: '#5A68FF' } },
                { name: 'Vouchers', itemStyle: { color: '#10B981' } },
                { name: 'Vouchees', itemStyle: { color: '#F59E0B' } },
              ],
              roam: true,
              draggable: true,
              label: {
                show: true,
                position: 'bottom',
                fontSize: 9,
              },
              force: {
                repulsion: 200,
                gravity: 0.1,
                edgeLength: 100,
              },
              lineStyle: {
                color: '#999',
                width: 1,
                opacity: 0.6,
              },
            },
          ],
        });
      } catch (error) {
        console.error('Failed to load vouching data:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [address, aptos]);

  // Handle click events on chart nodes
  const onChartClick = (params: any) => {
    // Only allow clicking on voucher/vouchee nodes, not the current account
    if (params.data && params.data.value && params.data.category !== 0) {
      const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
      const accountUrl = `${baseUrl}/accounts/${params.data.value}`;
      window.open(accountUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="w-full rounded-md shadow overflow-hidden h-[400px] ring-1 ring-black ring-opacity-5 bg-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading vouching network...</div>
        </div>
      </div>
    );
  }

  if (!options) {
    return (
      <div className="w-full rounded-md shadow overflow-hidden h-[400px] ring-1 ring-black ring-opacity-5 bg-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">No vouching data available</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'w-full rounded-md shadow overflow-hidden h-[400px]',
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

export default Vouching;
