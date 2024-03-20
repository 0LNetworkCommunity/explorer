import { useApolloClient } from '@apollo/client';
import { useEffect, useState } from 'react';
import { GET_MOVEMENTS, GetAccountMovementsRes } from './gql-types';
import { gqlMovementMapper } from './mappers';
import { Movement, OrderDirection } from './types';

export const useMovements = (
  address: string,
  order?: OrderDirection,
  after?: string,
  first?: number,
): {
  loading: boolean;
  total?: number;
  prevCursor?: string;
  nextCursor?: string;
  error?: string;
  movements?: Movement[];
} => {
  const apolloClient = useApolloClient();
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number>();
  const [movements, setMovements] = useState<Movement[]>();
  const [prevCursor, setPrevCursor] = useState<string>();
  const [nextCursor, setNextCursor] = useState<string>();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apolloClient.query<GetAccountMovementsRes>({
          query: GET_MOVEMENTS,
          variables: {
            address,
            order,
            after,
            first,
          },
        });
        const { movements } = res.data.account;
        setPrevCursor(movements.pageInfo.prevCursor || undefined);
        setTotal(movements.totalCount);
        setMovements(movements.edges.map((edge) => gqlMovementMapper(edge.node)));
        setNextCursor(
          movements.pageInfo.hasNextPage && movements.edges.length > 0
            ? movements.edges[movements.edges.length - 1].cursor
            : undefined,
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [address, after, first, order]);

  return { loading, total, movements, prevCursor, nextCursor };
};
