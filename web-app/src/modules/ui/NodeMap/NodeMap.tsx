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
  const [dimensions, setDimensions] = useState({ width: 688 / 3, height: 488 / 3 });

  useEffect(() => {
    function handleResize() {
      if (mapRef.current) {
        setDimensions({
          width: mapRef.current.offsetWidth,
          height: mapRef.current.offsetWidth * 0.7,
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
        .translate([dimensions.width / 2, dimensions.height / 2 + dimensions.height * 0.216]);

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
    <div ref={mapRef} className="lg:pb-6 w-full max-w-[500px] mx-auto">
      <div
        className="relative w-full bg-[#F5F5F5] bg-cover bg-center"
        style={{
          height: dimensions.height,
          backgroundImage: `url(${worldImg})`,
        }}
      >
        {points?.map((point, index) => (
          <div
            key={index}
            className="absolute bg-[#DE2F32]"
            style={{
              top: point[1] - 5,
              left: point[0] - 5,
              width: 6,
              height: 6,
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default NodeMap;
