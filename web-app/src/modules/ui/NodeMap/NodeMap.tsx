import { ReactNode, useEffect, useState, useRef } from 'react';
import { geoMercator } from 'd3-geo';
import worldImg from './world.png';
import { gql, useApolloClient } from '@apollo/client';

const GET_NODES = gql`
  query Nodes {
    nodes {
      latitude
      longitude
    }
  }
`;

function NodeMap(): ReactNode {
  const apollo = useApolloClient();
  const [points, setPoints] = useState<[number, number][]>();
  const mapRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 688, height: 488 });

  useEffect(() => {
    function handleResize() {
      if (mapRef.current) {
        setDimensions({
          width: mapRef.current.offsetWidth,
          height: mapRef.current.offsetWidth * 0.708,
        });
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      const projection = geoMercator()
        .scale(dimensions.width / 2 / Math.PI)
        .translate([dimensions.width / 2, dimensions.height / 2]);

      const { data } = await apollo.query<{
        nodes: {
          latitude: number;
          longitude: number;
        }[];
      }>({ query: GET_NODES });

      const nodes = data.nodes;
      const r = nodes.map((node) => projection([node.longitude, node.latitude])) as [
        number,
        number,
      ][];
      setPoints(r);
    };

    load();
  }, [apollo, dimensions]);

  return (
    <div ref={mapRef} style={{ width: '100%', maxWidth: '600px', margin: 'auto' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: dimensions.height,
          backgroundColor: '#F5F5F5',
          backgroundImage: `url(${worldImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {points?.map((point, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: point[1] - 5,
              left: point[0] - 5,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#DE2F32',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default NodeMap;
