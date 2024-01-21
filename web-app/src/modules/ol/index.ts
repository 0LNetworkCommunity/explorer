import { useEffect, useState } from "react";
import { Types } from "aptos";
import useAptos from "../aptos";

export const COIN_NAME = "LibraCoin";

export const COIN_MODULE = "gas_coin";

export const OL_FRAMEWORK = "0x1";

interface AggregatorData {
  handle: string;
  key: string;
  limit: string;
}

export interface CoinInfo {
  decimals: number;
  name: string;
  supply: {
    vec: [
      {
        aggregator: {
          vec: [AggregatorData];
        };
        integer: {
          vec: [];
        };
      }
    ];
  };
  symbol: string;
}

export interface ValidatorSet {
  active_validators: {
    addr: string;
    config: {
      consensus_pubkey: string;
      fullnode_addresses: string;
      network_addresses: string;
      validator_index: string;
    };
    voting_power: string;
  }[];
  consensus_scheme: number;
  pending_active: unknown[];
  pending_inactive: unknown[];
  total_joining_power: string;
  total_voting_power: string;
}

export const useValidatorSet = (): ValidatorSet | undefined => {
  const aptos = useAptos();
  const [validatorSet, setValidatorSet] = useState<ValidatorSet>();
  useEffect(() => {
    const load = async () => {
      const res = await aptos.getAccountResource(
        "0x1",
        "0x1::stake::ValidatorSet"
      );
      const validatorSet = res.data as ValidatorSet;
      setValidatorSet(validatorSet);
    };
    load();
  }, []);
  return validatorSet;
};

export interface Money {
  amount: number;
  symbol: string;
}

export const useTotalSupply = (): Money | undefined => {
  const aptos = useAptos();
  const [value, setValue] = useState<Money>();

  useEffect(() => {
    const load = async () => {
      const res = await aptos.getAccountResource(
        "0x1",
        "0x1::coin::CoinInfo<0x1::libra_coin::LibraCoin>"
      );
      const coinInfo = res.data as CoinInfo;

      const aggregatorData = coinInfo?.supply?.vec[0]?.aggregator?.vec[0];

      const tableItemRequest = {
        key_type: "address",
        value_type: "u128",
        key: aggregatorData.key,
      } as Types.TableItemRequest;

      const totalSupplyStr: string = await aptos.getTableItem(
        aggregatorData.handle,
        tableItemRequest
      );
      console.log('totalSupplyStr', totalSupplyStr);
      let totalSupply = parseInt(totalSupplyStr, 10);
      totalSupply = totalSupply / Math.pow(10, coinInfo.decimals);

      setValue({
        amount: totalSupply,
        symbol: coinInfo.symbol,
      });
    };

    load();
  }, []);

  return value;
};

export const useLedgerInfo = (): Types.IndexResponse | undefined => {
  const [ledgerInfo, setLedgerInfo] = useState<Types.IndexResponse>();
  const aptos = useAptos();

  useEffect(() => {
    const load = async () => {
      const ledgerInfo = await aptos.getLedgerInfo();
      setLedgerInfo(ledgerInfo);
    };

    load();

    const interval = setInterval(() => {
      load();
    }, 5_000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return ledgerInfo;
};