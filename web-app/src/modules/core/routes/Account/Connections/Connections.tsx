import { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import clsx from 'clsx';
import ReactECharts from 'echarts-for-react';

import neo4jService from '../../../../../services/neo4j.service';

interface Link {
  source: string;
  target: string;
  lineStyle: {
    width: number;
    color: string;
    curveness: number;
    type?: 'solid' | 'dashed';
  };
  tooltip: {
    formatter: () => string;
  };
}

interface RelationColors {
  CREATED: string;
  AUTOPAY: string;
  TRANSFERRED: string;
  VOUCHED: string;
  DEFAULT: string;
  [key: string]: string; // Add index signature
}

const Connections: FC = () => {
  const { accountAddress } = useParams();
  const [options, setOptions] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!accountAddress) return;

      try {
        setLoading(true);

        const sanitizedAddress = accountAddress.startsWith('0x')
          ? accountAddress.substring(2)
          : accountAddress;

        const connectionData = await neo4jService.getWalletConnections(sanitizedAddress);

        if (!connectionData || connectionData.nodes.length === 0) {
          setLoading(false);
          return;
        }

        // Find the current account node
        const currentAccountNode = connectionData.nodes.find(node =>
          node.address && node.address.toUpperCase() === sanitizedAddress.toUpperCase()
        );

        if (!currentAccountNode) {
          setError("Current account not found in returned data");
          setLoading(false);
          return;
        }

        const relationColors: RelationColors = {
          'CREATED': '#6B7280', // Gray for CREATED
          'AUTOPAY': '#10B981', // Green for AUTOPAY
          'TRANSFERRED': '#EF4444', // Red for TRANSFERRED
          'VOUCHED': '#3B82F6', // Blue for VOUCHED
          'DEFAULT': '#6B7280', // Default gray for unknown types
        };

        // Calculate min/max balance for node size scaling
        let minBalance = Number.MAX_VALUE;
        let maxBalance = 0;

        connectionData.nodes.forEach(node => {
          if (node.balance > maxBalance) maxBalance = node.balance;
          if (node.balance < minBalance) minBalance = node.balance;
        });

        const balanceRange = maxBalance - minBalance > 0 ? maxBalance - minBalance : 1;

        // List of commswap addresses (colored green)
        const commswapAddresses = [
          '7153A13691E832EC5C5E2F0503FB7D228FBB7C87DD0C285C29D3F1D9F320CD5C',
          '8D57A33412C4625289E35F2843E1D36EA19FA6BDE7816B1E3607C694926F01AE',
          'C6E97E7EF03A9162BEF775C9A77848DF83AFAF68350F0AFECB237BED495FBED7'
        ];

        // Process nodes
        const nodes = connectionData.nodes.map(node => {
          // Skip nodes without an address
          if (!node.address) {
            return null;
          }

          const isCurrentAccount = node.address.toUpperCase() === sanitizedAddress.toUpperCase();
          const isSpecialNode = commswapAddresses.includes(node.address.toUpperCase());

          const normalizedSize = isCurrentAccount
            ? 25
            : 10 + ((node.balance - minBalance) / balanceRange) * 15;

          return {
            id: node.id,
            name: node.address.slice(0, 8) + '...',
            symbolSize: normalizedSize,
            itemStyle: {
              color: isSpecialNode ? '#10B981' : (isCurrentAccount ? '#5A68FF' : '#64748B'),
            },
            tooltip: {
              formatter: () => {
                return `Address: ${node.address}<br/>` +
                       `Balance: ${node.balance.toLocaleString()} Ƚ<br/>` +
                       `Locked: ${node.locked.toLocaleString()} Ƚ<br/>` +
                       `Total In: ${node.totalIn.toLocaleString()} Ƚ<br/>` +
                       `Total Out: ${node.totalOut.toLocaleString()} Ƚ<br/>` +
                       (isCurrentAccount ? '' : 'Click to view account');
              }
            },
            value: node.address,
            fixed: false
          };
        }).filter(Boolean); // Remove null nodes

        // Process edges and handle multiple relationships
        const links: Link[] = [];
        const edgeCounts: Record<string, number> = {};

        // Calculate max transfer amount for scaling edge width
        let maxTransferAmount = 0;
        connectionData.relationships.forEach(rel => {
          if (rel.type === 'TRANSFERRED' && typeof rel.amount === 'number' && rel.amount > maxTransferAmount) {
            maxTransferAmount = rel.amount;
          }
        });

        // Create edges with properly styled relationships
        connectionData.relationships.forEach(rel => {
          const key = `${rel.startNodeId}-${rel.endNodeId}`;
          edgeCounts[key] = (edgeCounts[key] || 0) + 1;

          // Calculate line width for TRANSFERRED relationships
          const lineWidth = rel.type === 'TRANSFERRED' && typeof rel.amount === 'number' && maxTransferAmount > 0
            ? 1 + (rel.amount / maxTransferAmount) * 4
            : 1;

          // Calculate curveness based on number of edges between these nodes
          const curveness = edgeCounts[key] > 1 ? 0.2 + ((edgeCounts[key] - 1) * 0.1) : 0.2;

          // Set edge color based on relationship type
          // Safely access the relationColors object
          const color = rel.type in relationColors ? relationColors[rel.type] : relationColors.DEFAULT;

          links.push({
            source: rel.startNodeId,
            target: rel.endNodeId,
            lineStyle: {
              width: lineWidth,
              color: color,
              curveness: curveness,
              type: rel.type === 'CREATED' ? 'dashed' : 'solid',
            },
            tooltip: {
              formatter: () => {
                let tooltip = `Type: ${rel.type}<br/>`;

                if (rel.amount) {
                  tooltip += `Amount: ${rel.amount.toLocaleString()} Ƚ<br/>`;
                }

                if (rel.version) {
                  tooltip += `Version: ${rel.version.toLocaleString()}<br/>`;
                }

                if (rel.timestamp) {
                  const date = new Date(rel.timestamp * 1000);
                  tooltip += `Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                }

                return tooltip;
              }
            }
          });
        });

        // Create the chart options
        setOptions({
          tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(50, 50, 50, 0.95)',
            borderColor: 'transparent',
            borderRadius: 12,
            textStyle: {
              color: '#ffffff',
              fontSize: 12,
            },
            padding: [8, 12],
            confine: true,
          },
          series: [{
            type: 'graph',
            layout: 'force',
            data: nodes,
            links: links,
            roam: true,
            draggable: true,
            label: {
              show: false,
            },
            force: {
              repulsion: 200,
              edgeLength: [80, 150],
              gravity: 0.1,
              layoutAnimation: true,
              friction: 0.6
            },
            edgeSymbol: ['none', 'arrow'],
            edgeSymbolSize: [0, 6],
            emphasis: {
              focus: 'adjacency',
            }
          }]
        });
      } catch (error) {
        console.error('Failed to load connection data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load connection data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [accountAddress]);

  // Handle clicks on nodes (for navigation to that account)
  const onChartEvents = {
    'click': (eventParams: any) => {
      if (eventParams.dataType === 'node' && eventParams.data && eventParams.data.value) {
        const currentAddress = accountAddress?.startsWith('0x')
          ? accountAddress.substring(2).toUpperCase()
          : accountAddress?.toUpperCase();

        // Don't navigate when clicking on current account node
        if (eventParams.data.value.toUpperCase() !== currentAddress) {
          const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
          const accountUrl = `${baseUrl}/accounts/${eventParams.data.value}`;
          window.open(accountUrl, '_blank');
        }
      }
    },
    'dragstart': (eventParams: any) => {
      if (eventParams.data) {
        eventParams.data.fixed = true;
      }
    }
  };

  // Display states
  if (loading) {
    return (
      <div className="w-full rounded-md shadow overflow-hidden h-[600px] ring-1 ring-black ring-opacity-5 bg-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading connection network...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-md shadow overflow-hidden h-[600px] ring-1 ring-black ring-opacity-5 bg-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!options) {
    return (
      <div className="w-full rounded-md shadow overflow-hidden h-[600px] ring-1 ring-black ring-opacity-5 bg-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">No connection data available</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'w-full rounded-md shadow overflow-hidden h-[600px]',
        'ring-1 ring-black ring-opacity-5',
        'bg-white',
      )}
    >
      <ReactECharts
        option={options}
        style={{ height: '100%', width: '100%' }}
        onEvents={onChartEvents}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

export default Connections;
