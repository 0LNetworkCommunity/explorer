import type {
  AccountInfo,
  AdapterPlugin,
  NetworkInfo,
  SignMessagePayload,
  SignMessageResponse,
  WalletName,
} from "@aptos-labs/wallet-adapter-core";
import goose from "./goose";
import { Network, Types } from "aptos";
export const PosteroWalletName = "Postero" as WalletName<"Postero">;

interface SelectWalletEvent {
  jsonrpc: "2.0";
  method: "select_wallet";
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
  onEvent: (callback: EventListener) => () => void;
}

interface TransactionOptions {
  max_gas_amount?: bigint;
  gas_unit_price?: bigint;
}

export class PosteroWallet implements AdapterPlugin {
  public readonly name = PosteroWalletName;

  public readonly url = "https://0l.fyi";

  public readonly icon = goose;

  public readonly providerName?: string | undefined = undefined;

  public readonly provider: PosteroProvider;

  private accountChangeListeners: AccountChangeListener[] = [];

  private onEvent = (event: JSONRPCEvent) => {
    switch (event.method) {
      case "select_wallet": {
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
    return `https://wallet.0l.fyi/explore?link=${data.url}`;
  }

  public connect(): Promise<AccountInfo> {
    return this.provider.connect();
  }

  public async disconnect(): Promise<void> {
    return this.provider.disconnect();
  }

  public async network(): Promise<NetworkInfo> {
    return {
      name: Network.MAINNET,
      chainId: "1",
      url: undefined, // string;
    };
  }

  public async signAndSubmitTransaction(
    transaction: Types.TransactionPayload,
    options?: any
  ): Promise<{ hash: Types.HexEncodedBytes }> {
    console.log("signAndSubmitTransaction", transaction, options);
    throw new Error("Method not implemented.");
  }

  public async signMessage(
    message: SignMessagePayload
  ): Promise<SignMessageResponse> {
    console.log("signMessage", message);
    throw new Error("Method not implemented.");
  }

  public async signTransaction(
    _transaction: Types.TransactionPayload,
    _options?: TransactionOptions
  ): Promise<Uint8Array | null> {
    const res = await this.provider.signTransaction({
      EntryFunction: {
        module: {
          address:
            "00000000000000000000000000000000d0383924341821f9e43a6cff46f0a74e",
          name: "message",
        },
        function: "set_message",
        ty_args: [],
        args: [
          [14, 72, 101, 108, 108, 111, 44, 87, 111, 114, 108, 100, 32, 51, 33],
        ],
      },
    });
    console.log("res", res);
    return null;
  }

  public async onNetworkChange(callback: any): Promise<void> {
    console.log("onNetworkChange", callback);
  }

  public async onAccountChange(callback: AccountChangeListener): Promise<any> {
    this.accountChangeListeners.push(callback);
  }
}
