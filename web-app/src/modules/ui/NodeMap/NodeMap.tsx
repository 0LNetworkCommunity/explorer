import { ReactNode, useEffect, useState } from "react";
import { geoMercator } from "d3-geo";
import worldImg from "./world.png";
import { gql, useApolloClient } from "@apollo/client";

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

  useEffect(() => {
    const load = async () => {
      const width = 688;
      const height = 688;

      const projection = geoMercator()
        .scale(width / 2 / Math.PI)
        .translate([width / 2, height / 2]);

      const { data } = await apollo.query<{
        nodes: {
          latitude: number;
          longitude: number;
        }[];
      }>({ query: GET_NODES });

      const nodes = data.nodes;
      const r = nodes.map((node) => {
        return projection([node.longitude, node.latitude]);
      }) as [number, number][];
      setPoints(r);
    };
    load();
  }, []);

  return (
    <div>
      <div
        style={{
          position: 'relative',
          width: 688,
          height: 488,
          backgroundColor: '#F5F5F5',
          backgroundImage: `url(${worldImg})`,
          backgroundSize: '100%',
        }}
      >
        {points?.map((point) => {
          return (
            <div
              style={{
                position: 'absolute',
                top: point[1] - 5,
                left: point[0] - 5,
                width: 10,
                height: 10,
                borderRadius: 1,
                background: '#DE2F32',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default NodeMap;
