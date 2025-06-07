import { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import clsx from 'clsx';
import ReactECharts from 'echarts-for-react';

import neo4jService from '../../../../../services/neo4j.service';

const Connections: FC = () => {
  const { accountAddress } = useParams();
  const [options, setOptions] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({});

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
          node.address.toUpperCase() === sanitizedAddress.toUpperCase()
        );

        if (!currentAccountNode) {
          setError("Current account not found in returned data");
          setLoading(false);
          return;
        }

        // Define colors for different relationship types
        const relationColors = {
          'CREATED': '#6B7280', // Gray for CREATED
          'AUTOPAY': '#10B981', // Green for AUTOPAY
          'TRANSFERRED': '#EF4444', // Red for TRANSFERRED
          'VOUCHED': '#3B82F6', // Blue for VOUCHED
          'DEFAULT': '#6B7280', // Default gray for unknown types
        };

        // Find the minimum and maximum balance values for node size scaling
        let minBalance = Number.MAX_VALUE;
        let maxBalance = 0;

        connectionData.nodes.forEach(node => {
          if (node.balance > maxBalance) maxBalance = node.balance;
          if (node.balance < minBalance) minBalance = node.balance;
        });

        // Prevent division by zero if all balances are the same
        const balanceRange = maxBalance - minBalance > 0 ? maxBalance - minBalance : 1;

        // List of commswap addresses (colored green)
        const commswapAddresses = [
          '7153A13691E832EC5C5E2F0503FB7D228FBB7C87DD0C285C29D3F1D9F320CD5C',
          '8D57A33412C4625289E35F2843E1D36EA19FA6BDE7816B1E3607C694926F01AE',
          'C6E97E7EF03A9162BEF775C9A77848DF83AFAF68350F0AFECB237BED495FBED7'
        ];

        // Extract unique relationship types and initialize them all as selected
        const types = Array.from(new Set(connectionData.relationships.map(rel => rel.type)));
        const initialSelectedTypes = types.reduce((acc, type) => {
          acc[type] = true;
          return acc;
        }, {} as Record<string, boolean>);
        setSelectedTypes(initialSelectedTypes);

        // Prepare nodes data
        const nodes = connectionData.nodes.map(node => {
          const isCurrentAccount = node.address.toUpperCase() === sanitizedAddress.toUpperCase();
          const isSpecialNode = commswapAddresses.includes(node.address.toUpperCase());

          // Calculate node size based on normalized balance (range 10-25)
          const normalizedSize = isCurrentAccount
            ? 25
            : 10 + ((node.balance - minBalance) / balanceRange) * 15;

          return {
            id: node.id,
            name: isCurrentAccount ? 'Current Account' : node.address.slice(0, 8) + '...',
            value: node.address,
            symbolSize: normalizedSize,
            itemStyle: {
              color: isSpecialNode ? '#10B981' : (isCurrentAccount ? '#5A68FF' : '#64748B'),
            },
            label: {
              show: false,
            },
            tooltip: {
              formatter: (params: any) => {
                return `Address: ${node.address}<br/>` +
                       `Balance: ${node.balance.toLocaleString()} Ƚ<br/>` +
                       `Locked: ${node.locked.toLocaleString()} Ƚ<br/>` +
                       `Total In: ${node.totalIn.toLocaleString()} Ƚ<br/>` +
                       `Total Out: ${node.totalOut.toLocaleString()} Ƚ<br/>` +
                       (isCurrentAccount ? '' : 'Click to view account');
              }
            },
            category: isSpecialNode ? 2 : (isCurrentAccount ? 0 : 1),
            fixed: false
          };
        });

        // Calculate max transfer amount for edge thickness scaling
        let maxTransferAmount = 0;
        const transferRelationships = connectionData.relationships.filter(rel =>
          rel.type === 'TRANSFERRED' && typeof rel.amount === 'number'
        );

        if (transferRelationships.length > 0) {
          maxTransferAmount = Math.max(...transferRelationships.map(rel => rel.amount));
        }

        // Handle multiple edges between the same nodes
        const multiEdges = new Map<string, number>();

        // Prepare edges data with unique relationship/edge IDs
        const edges = connectionData.relationships.map((rel, index) => {
          // Create a unique key for this edge pair to track multiple edges
          const edgeKey = `${rel.startNodeId}-${rel.endNodeId}`;

          // Count occurrences of this edge pair
          const count = multiEdges.get(edgeKey) || 0;
          multiEdges.set(edgeKey, count + 1);

          // Adjust curveness based on the count of edges between these nodes
          const curveness = count * 0.1 + 0.1;

          // Calculate line width based on amount for TRANSFERRED relationships
          const lineWidth = rel.type === 'TRANSFERRED' && typeof rel.amount === 'number' && maxTransferAmount > 0
            ? 1 + (rel.amount / maxTransferAmount) * 4
            : 1;

          // Set color based on relationship type
          const color = relationColors[rel.type as keyof typeof relationColors] || relationColors.DEFAULT;

          return {
            id: `edge-${index}`, // Ensure each edge has a unique ID
            name: rel.type,      // Important: name must match legend data
            source: rel.startNodeId,
            target: rel.endNodeId,
            lineStyle: {
              width: lineWidth,
              color: color,
              curveness: curveness,
              type: rel.type === 'CREATED' ? 'dashed' : 'solid',
              opacity: 0.8,
            },
            tooltip: {
              formatter: (params: any) => {
                let tooltip = `Type: ${rel.type}<br/>`;

                if (rel.amount) {
                  tooltip += `Amount: ${rel.amount.toLocaleString()} Ƚ<br/>`;
                }

                if (rel.version) {
                  tooltip += `Version: ${rel.version.toLocaleString()}<br/>`;
                }

                if (rel.timestamp) {
                  // Format date with proper timezone handling
                  const date = new Date(rel.timestamp * 1000);
                  tooltip += `Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                }

                return tooltip;
              }
            }
          };
        });

        // Prepare legend data
        const legendData = types.map(type => ({
          name: type,
          icon: 'circle',
          itemStyle: {
            color: relationColors[type as keyof typeof relationColors] || relationColors.DEFAULT
          }
        }));

        // Create chart options
        setOptions({
          title: {
            text: '',
            left: 'center',
            top: 10,
            textStyle: {
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
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
          legend: {
            data: legendData,
            bottom: 10,
            icon: 'circle',
            textStyle: {
              fontSize: 10,
            },
            selected: initialSelectedTypes,
            selector: false,
          },
          series: [
            {
              type: 'graph',
              layout: 'force',
              data: nodes,
              links: edges,
              categories: [
                { name: 'Current Account' },
                { name: 'Connected Account' },
                { name: 'Special Account' },
              ],
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
                friction: 0.6,
              },
              edgeSymbol: ['none', 'arrow'],
              edgeSymbolSize: [0, 6],
              emphasis: {
                focus: 'adjacency',
                lineStyle: {
                  width: 2,
                },
              },
            }
          ],
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

  // Chart events
  const onChartEvents = {
    'click': (params: any) => {
      // Handle click on nodes to navigate to account page
      if (params.data && params.data.value && params.data.category !== 0) {
        const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
        const accountUrl = `${baseUrl}/accounts/${params.data.value}`;
        window.open(accountUrl, '_blank');
      }
    },
    'legendselectchanged': (params: any) => {
      setSelectedTypes(params.selected);
    },
    'dragstart': (params: any) => {
      if (params.data) {
        params.data.fixed = true;
      }
    }
  };

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
        notMerge={true}
      />
    </div>
  );
};

export default Connections;
