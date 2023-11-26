import { FC, useState } from "react";
import {
  AptosAccount, BCS, TxnBuilderTypes,
  HexString,
} from "aptos";

import useAptos from "../../../aptos";
import axios from "axios";
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";

const {
  AccountAddress,
  EntryFunction,
  TransactionPayloadEntryFunction,
  RawTransaction,
  ChainId,
  TransactionAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  SignedTransaction
} = TxnBuilderTypes;

const MessageForm: FC = () => {
  const aptos = useAptos();
  const [message, setMessage] = useState('');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const entryFunctionPayload = new TransactionPayloadEntryFunction(
      EntryFunction.natural(
        // Fully qualified module name, `AccountAddress::ModuleName`
        "0x00000000000000000000000000000000d0383924341821f9e43a6cff46f0a74e::message",
        // Module function
        "set_message",
        // The coin type to transfer
        [],
        // Arguments for function `transfer`: receiver account address and amount to transfer
        [
          BCS.bcsSerializeStr(message)
        ],
      ),
    );

    const chainId = await aptos.getChainId();

    const walletAddress = 'D0383924341821F9E43A6CFF46F0A74E';
    const account = await aptos.getAccount(walletAddress);

    const rawTxn = new RawTransaction(
      // Transaction sender account address
      AccountAddress.fromHex(walletAddress),

      BigInt(account.sequence_number),
      entryFunctionPayload,
      // Max gas unit to spend
      BigInt(2000000),
      // Gas price per unit
      BigInt(200),
      // Expiration timestamp. Transaction is discarded if it is not executed within 10 seconds from now.
      BigInt(Math.floor(Date.now() / 1000) + 10),
      // BigInt(1699656761),
      new ChainId(chainId),
    );

    const privateKey = new HexString("0x60b9b1bcc7f9af9011d7fb26466cb00fd35a21db22f373f085b3bc0604aca78c");

    const signer = new AptosAccount(privateKey.toUint8Array());

    const hash = sha3Hash.create();
    hash.update("DIEM::RawTransaction");
    const prefix = hash.digest();
    const body = BCS.bcsToBytes(rawTxn);
    const mergedArray = new Uint8Array(prefix.length + body.length);
    mergedArray.set(prefix);
    mergedArray.set(body, prefix.length);

    const signingMessage = mergedArray;

    const signature = signer.signBuffer(signingMessage);
    const sig = new Ed25519Signature(signature.toUint8Array());

    const authenticator = new TransactionAuthenticatorEd25519(
      new Ed25519PublicKey(signer.pubKey().toUint8Array()),
      sig
    );
    const signedTx = new SignedTransaction(rawTxn, authenticator);

    const bcsTxn = BCS.bcsToBytes(signedTx);

    const res = await axios({
      method: 'POST',
      url: 'https://rpc.0l.fyi./v1/transactions',
      headers: {
        "content-type": "application/x.diem.signed_transaction+bcs",
      },
      data: bcsTxn,
    });
    console.log(res);
  };

  return (
    <div>
      <h3>Set Message</h3>
      <form
        onSubmit={onSubmit}
      >
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button type="submit">Set</button>
      </form>
    </div>
  );
};

export default MessageForm;