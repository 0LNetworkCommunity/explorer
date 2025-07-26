import { Buffer } from 'buffer';
import type {
  AccountInfo,
  AdapterPlugin,
  NetworkInfo,
  SignMessagePayload,
  SignMessageResponse,
  WalletName,
} from '@aptos-labs/wallet-adapter-core';
import { Network, Types, TxnBuilderTypes, BCS } from 'aptos';
import './postero';

import goose from './goose';

export const PosteroWalletName = 'Postero' as WalletName<'Postero'>;

const { EntryFunction } = TxnBuilderTypes;

interface SelectWalletEvent {
  jsonrpc: '2.0';
  method: 'select_wallet';
  params: [string, string];
}

type JSONRPCEvent = SelectWalletEvent;

type EventListener = (event: JSONRPCEvent) => void;

type AccountChangeListener = (newAddress: AccountInfo) => Promise<void>;

interface PosteroProvider {
  connect: () => Promise<AccountInfo>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signTransaction: (transaction: any) => Promise<string>;
  signAndSubmitTransaction: (transaction: any) => Promise<string>;
  onEvent: (callback: EventListener) => () => void;
}

interface TransactionOptions {
  max_gas_amount?: bigint;
  gas_unit_price?: bigint;
}

export class PosteroWallet implements AdapterPlugin {
  public readonly name = PosteroWalletName;

  public readonly url = 'https://0l.fyi';

  public readonly icon = goose;

  public readonly providerName?: string | undefined = undefined;

  public readonly provider: PosteroProvider;

  private accountChangeListeners: AccountChangeListener[] = [];

  private onEvent = (event: JSONRPCEvent) => {
    switch (event.method) {
      case 'select_wallet': {
        const [address, publicKey] = event.params;
        console.log([address, publicKey]);

        for (const accountChangeListener of this.accountChangeListeners) {
          accountChangeListener({ address, publicKey });
        }
      }
    }
  };

  public constructor() {
    const posteroProvider: PosteroProvider = (window as any).postero;
    posteroProvider.onEvent((event) => this.onEvent(event));
    this.provider = posteroProvider;
  }

  public deeplinkProvider(data: { url: string }): string {
    return `https://wallet.scan.openlibra.world/explore?link=${data.url}`;
  }

  public async connect(): Promise<AccountInfo> {
    return await this.provider.connect();
  }

  public async disconnect(): Promise<void> {
    return this.provider.disconnect();
  }

  public async network(): Promise<NetworkInfo> {
    return {
      name: Network.MAINNET,
      chainId: '1',
      url: undefined, // string;
    };
  }

  public async signAndSubmitTransaction(
    transaction: Types.TransactionPayload,
    // options?: any
  ): Promise<{ hash: Types.HexEncodedBytes }> {
    if (transaction.type === 'entry_function_payload') {
      const entryFunctionPayload = transaction as Types.EntryFunctionPayload;
      const [moduleAddress, moduleName, ...rest] = entryFunctionPayload.function.split('::');
      const moduleFunction = rest.join('::');

      const entryFunc = EntryFunction.natural(
        `${moduleAddress}::${moduleName}`,
        moduleFunction,
        [],
        entryFunctionPayload.arguments,
      );
      const serializer = new BCS.Serializer();
      entryFunc.serialize(serializer);
      const value = serializer.getBytes();

      const res = await this.provider.signAndSubmitTransaction({
        type: 'entry_function_payload',
        payload: Buffer.from(value).toString('base64'),
      });
      console.log(res);
    }

    throw new Error('Method not implemented.');
  }

  public async signMessage(message: SignMessagePayload): Promise<SignMessageResponse> {
    console.log('signMessage', message);
    throw new Error('Method not implemented.');
  }

  public async signTransaction(
    transaction: Types.TransactionPayload,
    options?: TransactionOptions,
  ): Promise<Uint8Array | null> {
    console.log(transaction, options);

    // const res = await this.provider.signTransaction({
    //   EntryFunction: {
    //     module: {
    //       address:
    //         "00000000000000000000000000000000d0383924341821f9e43a6cff46f0a74e",
    //       name: "message",
    //     },
    //     function: "set_message",
    //     ty_args: [],
    //     args: [
    //       [14, 72, 101, 108, 108, 111, 44, 87, 111, 114, 108, 100, 32, 51, 33],
    //     ],
    //   },
    // });
    // console.log("res", res);
    return null;
  }

  public async onNetworkChange(callback: any): Promise<void> {
    console.log('onNetworkChange', callback);
  }

  public async onAccountChange(callback: AccountChangeListener): Promise<any> {
    this.accountChangeListeners.push(callback);
  }
}
