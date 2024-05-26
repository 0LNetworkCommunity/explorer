import { Args, Mutation, Resolver, Query, Subscription } from "@nestjs/graphql";
import { Inject } from "@nestjs/common";
import { Repeater } from "@repeaterjs/repeater";

import { Types } from "../../types.js";
import { ITransaction, ITransactionsService } from "./interfaces.js";
import { Transaction } from "./Transaction.js";

@Resolver()
export class TransactionsResolver {
  public constructor(
    @Inject(Types.ITransactionsService)
    private readonly transactionsService: ITransactionsService,
  ) {}

  @Query(() => [Transaction], { name: "walletTransactions" })
  public async getWalletTransactions(
    @Args("address", { type: () => Buffer })
    address: Uint8Array,
  ): Promise<ITransaction[]> {
    return this.transactionsService.getWalletTransactions(address);
  }

  @Mutation(() => Boolean)
  public async newTransaction(
    @Args("signedTransaction", { type: () => Buffer })
    signedTransaction: Buffer,
  ) {
    const txHash =
      await this.transactionsService.newTransaction(signedTransaction);

    // try {
    //   const res = await axios<{
    //     hash: string;
    //   }>({
    //     method: 'POST',
    //     url: 'https://rpc.0l.fyi/v1/transactions',
    //     headers: {
    //       "content-type": "application/x.diem.signed_transaction+bcs",
    //     },
    //     data: sigendTransactionArg,
    //   });
    //   console.log(res.status);

    //   // status: 400,
    //   // statusText: 'Bad Request',
    //   // data: {
    //   //   message: 'Invalid transaction: Type: Validation Code: TRANSACTION_EXPIRED',
    //   //   error_code: 'vm_error',
    //   //   vm_error_code: 6
    //   // }

    //   if (res.status === 202) {
    //     console.log(res.data);
    //     // console.log(`tx hash = ${res.data.hash}`);
    //     // return new Uint8Array(Buffer.from(res.data.hash.substring(2), "hex"));
    //   }
    // } catch (error) {
    //   console.error(error);
    // }

    // fe01b4146468cd24426912cbddf545b918dc9bad4b990dc013aa71491c71feb806000000000000000200000000000000000000000000000000000000000000000000000000000000010a6f6c5f6163636f756e74087472616e736665720002200000000000000000000000000000000003a3fcfaf8224bd598d96bbaf0c6d99f0838b556070000000080841e0000000000c80000000000000043fe506600000000010020b1d5f139f70764efdb2e6e9efbf6d74825ddedfe59e29413334be3fe787a793e4003703db0d71151f9ee73f91bec272ac81f2e4e6684e98d9f30af8441b58f1f54f8654ddd541ac740902b4bf44154d6ec3a49035ae06874ca9b5ad5dc27816a06
    // newTransaction <Buffer fe 01 b4 14 64 68 cd 24 42 69 12 cb dd f5 45 b9 18 dc 9b ad 4b 99 0d c0 13 aa 71 49 1c 71 fe b8 06 00 00 00 00 00 00 00 02 00 00 00 00 00 00 00 00 00 ... 211 more bytes>
    // signedTransaction o {
    //   raw_txn: i {
    //     sender: r { data: [Uint8Array] },
    //     sequence_number: 6n,
    //     payload: t { entryFunction: [t] },
    //     max_gas_amount: 2000000n,
    //     gas_unit_price: 200n,
    //     expiration_timestamp_secs: 1716584003n,
    //     chain_id: a { chainId: 1 }
    //   },
    //   authenticator: s { public_key: n { key: [n] }, signature: a { data: [n] } }
    // }
    // raw_txn i {
    //   sender: r {
    //     data: Uint8Array(32) [
    //       254,   1, 180,  20, 100, 104, 205,  36,
    //        66, 105,  18, 203, 221, 245,  69, 185,
    //        24, 220, 155, 173,  75, 153,  13, 192,
    //        19, 170, 113,  73,  28, 113, 254, 184
    //     ]
    //   },
    //   sequence_number: 6n,
    //   payload: t {
    //     entryFunction: t {
    //       module_name: [t],
    //       function_name: [t],
    //       type_args: [],
    //       args: [Array]
    //     }
    //   },
    //   max_gas_amount: 2000000n,
    //   gas_unit_price: 200n,
    //   expiration_timestamp_secs: 1716584003n,
    //   chain_id: a { chainId: 1 }
    // }
    // signedTransaction.raw_txn.payload t {
    //   entryFunction: t {
    //     module_name: t { address: [r], name: [t] },
    //     function_name: t { identifier: 'transfer' },
    //     type_args: [],
    //     args: [ [l], [l] ]
    //   }
    // }
    // entryFunction t {
    //   module_name: t {
    //     address: r { data: [Uint8Array] },
    //     name: t { identifier: 'ol_account' }
    //   },
    //   function_name: t { identifier: 'transfer' },
    //   type_args: [],
    //   args: [ l { value: [a] }, l { value: [a] } ]
    // }
    // function_name t { identifier: 'transfer' }
    // module_name t {
    //   address: r {
    //     data: Uint8Array(32) [
    //       0, 0, 0, 0, 0, 0, 0, 0, 0,
    //       0, 0, 0, 0, 0, 0, 0, 0, 0,
    //       0, 0, 0, 0, 0, 0, 0, 0, 0,
    //       0, 0, 0, 0, 1
    //     ]
    //   },
    //   name: t { identifier: 'ol_account' }
    // }
    // args [
    //   l { value: a { value: [Uint8Array] } },
    //   l { value: a { value: [Uint8Array] } }
    // ]
    // type_args []
    // 202
    // {
    //   hash: '0x10fa0d856882726ace476e51a5ad63c3a82cd013f1179a90598f33cf75f277d4',
    //   sender: '0xfe01b4146468cd24426912cbddf545b918dc9bad4b990dc013aa71491c71feb8',
    //   sequence_number: '6',
    //   max_gas_amount: '2000000',
    //   gas_unit_price: '200',
    //   expiration_timestamp_secs: '1716584003',
    //   payload: {
    //     function: '0x1::ol_account::transfer',
    //     type_arguments: [],
    //     arguments: [ '0x3a3fcfaf8224bd598d96bbaf0c6d99f', '123123000' ],
    //     type: 'entry_function_payload'
    //   },
    //   signature: {
    //     public_key: '0xb1d5f139f70764efdb2e6e9efbf6d74825ddedfe59e29413334be3fe787a793e',
    //     signature: '0x03703db0d71151f9ee73f91bec272ac81f2e4e6684e98d9f30af8441b58f1f54f8654ddd541ac740902b4bf44154d6ec3a49035ae06874ca9b5ad5dc27816a06',
    //     type: 'ed25519_signature'
    //   }
    // }

    return true;
  }

  @Subscription((returns) => String)
  public async walletTransaction(
    @Args({ name: "address", type: () => Buffer })
    address: Buffer,
  ) {
    console.log("SUB", "walletTransaction", address.toString("hex"));

    const walletAddress = address.toString("hex").toUpperCase();
    return new Repeater(async (push, stop) => {
      let timeout: NodeJS.Timeout | undefined;

      const ping = () => {
        timeout = setTimeout(() => {
          push({
            walletTransaction: new Date().toISOString(),
          });

          ping();
        }, 3_000);
      };
      ping();

      // const sub = this.natsService.nc.subscribe(`wallet.${walletAddress}`, {
      //   callback(err, msg) {
      //     if (err) {
      //       stop(err);
      //     } else {
      //       const { version } = msg.json<{ version: string }>();
      //       push({
      //         walletMovement: version,
      //       });
      //     }
      //   },
      // });

      await stop;
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }

      // sub.unsubscribe();
    });
  }
}
