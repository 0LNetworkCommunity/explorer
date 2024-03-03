import { useApolloClient } from '@apollo/client';
import { useEffect, useState } from 'react';
import { GET_MOVEMENTS, GetAccountMovementsRes } from './gql-types';
import { gqlMovementMapper } from './mappers';
import { Movement } from './types';

export const useMovements = (address: string): Movement[] => {
  const apolloClient = useApolloClient();
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await apolloClient.query<GetAccountMovementsRes>({
        query: GET_MOVEMENTS,
        variables: {
          address,
        },
      });
      const movements = res.data.account.movements.map(gqlMovementMapper);
      setMovements(movements);
    };
    load();
  }, [address]);

  return movements;
};
