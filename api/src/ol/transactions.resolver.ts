import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { Deserializer, Serializer, TransactionPayload, SignedTransaction, TransactionPayloadEntryFunction, TransactionAuthenticatorEd25519 } from "@aptos-labs/ts-sdk";
import axios from "axios";
import { sha3_256 } from '@noble/hashes/sha3';
import { PrismaService } from "../prisma/prisma.service.js";
import { Prisma } from "@prisma/client";

@Resolver()
export class TransactionsResolver {

  public constructor(
    private readonly prisma: PrismaService,
  ) {}


  @Mutation(() => Boolean)
  public async newTransaction(
    @Args("signedTransaction", { type: () => Buffer })
    sigendTransactionArg: Buffer,
  ) {
    console.log("newTransaction", sigendTransactionArg);

    const deserializer = new Deserializer(sigendTransactionArg);
    const signedTransaction = SignedTransaction.deserialize(deserializer);

    console.log('sender', signedTransaction.raw_txn.sender.toUint8Array());
    console.log('sequence_number', signedTransaction.raw_txn.sequence_number);
    console.log('max_gas_amount', signedTransaction.raw_txn.max_gas_amount);
    console.log('gas_unit_price', signedTransaction.raw_txn.gas_unit_price);
    console.log('expiration_timestamp_secs', signedTransaction.raw_txn.expiration_timestamp_secs);
    console.log('chain_id', signedTransaction.raw_txn.chain_id.chainId);

    const serializer = new Serializer();
    signedTransaction.serialize(serializer);

    if (
      signedTransaction.raw_txn.payload instanceof
      TransactionPayloadEntryFunction
    ) {
      const txHash = sha3_256
        .create()
        .update(sha3_256.create().update("DIEM::Transaction").digest())
        .update(new Uint8Array([0]))
        .update(serializer.toUint8Array())
        .digest();

      if (signedTransaction.authenticator instanceof TransactionAuthenticatorEd25519) {
        console.log(
          'public_key',
          signedTransaction.authenticator.public_key.toUint8Array()
        );
        console.log(
          'signature',
          signedTransaction.authenticator.signature.toUint8Array()
        );
      console.log('>>>', signedTransaction.authenticator instanceof TransactionAuthenticatorEd25519);

      const entryFunctionPayload = signedTransaction.raw_txn.payload;

      const { entryFunction } = entryFunctionPayload;
      entryFunction.function_name.identifier;

      console.log('function_name', entryFunction.function_name.identifier);
      console.log('module_address', entryFunction.module_name.address.data);
      console.log('module_name', entryFunction.module_name.name);
      console.log('args', entryFunction.args);
      console.log('type_args', entryFunction.type_args);

      const toBytea = (input: Uint8Array) => {
        return (
          `\\x${Buffer.from(input).toString('hex')}`
        );
      };

      await this.prisma.$queryRaw`
        INSERT INTO "PendingTransaction" (
          "hash", "sender", "sequenceNumber",
          "maxGasAmount", "gasUnitPrice", "expirationTimestampSecs",
          "chainId", "publicKey", "signature", "functionName",
          "moduleAddress", "moduleName", "args",
          "typeArgs"
        ) VALUES (
          ${txHash},
          ${signedTransaction.raw_txn.sender.toUint8Array()},
          ${signedTransaction.raw_txn.sequence_number},
          ${signedTransaction.raw_txn.max_gas_amount},
          ${signedTransaction.raw_txn.gas_unit_price},
          ${signedTransaction.raw_txn.expiration_timestamp_secs},
          ${signedTransaction.raw_txn.chain_id.chainId},
          ${signedTransaction.authenticator.public_key.toUint8Array()},
          ${signedTransaction.authenticator.signature.toUint8Array()},
          ${entryFunction.function_name.identifier},
          ${entryFunction.module_name.address.data},
          ${entryFunction.module_name.name.identifier},
          ${Prisma.raw(
            `'{${entryFunction.args
              .map((arg) => toBytea(arg.bcsToBytes()))
              .join(",")}}'`,
          )},
          ${[]}
        )
        ON CONFLICT DO NOTHING
      `;
      }
    }

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

}
