export interface AEvent {
  txHash: Uint8Array;
  index: number;
  date: Date;
}

export interface Amount {
  denom: string;
  amount: string;
}

export type PoolSwapEvent = AEvent & {
  sender: string;
  side: string;
  amount: bigint;
};

export type MintEvent = AEvent & {
  amount: bigint;
  mint_to_address: string;
  txHash: Uint8Array;
};

export type BurnEvent = AEvent & {
  date: Date;
  amount: bigint;
  burn_from_address: string;
};

export type TransferEvent = AEvent & {
  from_address: string;
  to_address: string;
  amount: string;
};

export interface MsgMint {
  "@type": "/osmosis.tokenfactory.v1beta1.MsgMint";
  sender: string;
  mint_to_address: string;
  amount: Amount;
}

export interface MsgSwapExactAmountInRoute {
  pool_id: string;
  token_out_denom: string;
}

export interface MsgSwapExactAmountIn {
  "@type": "/osmosis.poolmanager.v1beta1.MsgSwapExactAmountIn";
  sender: string;
  routes: MsgSwapExactAmountInRoute[];
  token_in: Amount;
  token_out_min_amount: string;
}

export interface MsgSwapExactAmountOutRoute {
  pool_id: string;
  token_in_denom: string;
}

export interface MsgSwapExactAmountOut {
  "@type": "/osmosis.poolmanager.v1beta1.MsgSwapExactAmountOut";
  sender: string;
  routes: MsgSwapExactAmountOutRoute[];
  token_in_max_amount: string;
  token_out: Amount;
}

export interface MsgBurn {
  "@type": "/osmosis.tokenfactory.v1beta1.MsgBurn";
  sender: string;
  amount: Amount;
  burn_from_address: string;
}

export interface MsgSend {
  "@type": "/cosmos.bank.v1beta1.MsgSend";
  from_address: string;
  to_address: string;
  amount: Amount[];
}

export type Msg =
  | MsgMint
  | MsgSwapExactAmountIn
  | MsgSwapExactAmountOut
  | MsgBurn
  | MsgSend;
