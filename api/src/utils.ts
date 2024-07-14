import { rm } from 'node:fs/promises';
import os from 'node:os';
import pathUtil from 'node:path';
import fs from 'node:fs';

import { sha3_256 } from '@noble/hashes/sha3';
import {
  Deserializer,
  Serializer,
  SignedTransaction,
  TransactionPayloadEntryFunction,
} from '@aptos-labs/ts-sdk';
import * as d3 from 'd3-array';
import BN from 'bn.js';

export const cleanUp = async (...files: string[]) => {
  for (const file of files) {
    await rm(file, { recursive: true, force: true });
  }
};

export const createTmpDir = async (): Promise<string> => {
  return await fs.promises.mkdtemp(pathUtil.join(os.tmpdir(), 'explorer-api-'));
};

export function parseHexString(str: string): Uint8Array {
  let cleanStr = str;

  // strip 0x prefix
  if (cleanStr.length >= 2 && cleanStr[0] === '0' && (cleanStr[1] === 'x' || cleanStr[1] === 'X')) {
    cleanStr = cleanStr.substring(2);
  }

  if ((cleanStr.length & 1) === 1) {
    // even length
    cleanStr = `0${cleanStr}`;
  }

  cleanStr = cleanStr.toUpperCase();

  if (!/^[0-9ABCDEF]*$/.test(cleanStr)) {
    throw new Error('Invalid hex input');
  }

  return new Uint8Array(Buffer.from(cleanStr, 'hex'));
}

export const parseAddress = (address: string): Buffer => {
  let addr = address;

  // strip 0x prefix
  if (addr.length >= 2 && addr[0] === '0' && (addr[1] === 'x' || addr[1] === 'X')) {
    addr = addr.substring(2);
  }

  if (addr.length > 64) {
    throw new Error('Invalid address length');
  }

  if (addr.length <= 32) {
    addr = addr.padStart(32, '0');
  } else if (addr.length < 64) {
    addr = addr.padStart(64, '0');
  }

  return Buffer.from(addr, 'hex');
};

export const bnBisect = d3.bisector((a: BN, b: BN) => {
  if (a.lt(b)) {
    return -1;
  }
  if (a.gt(b)) {
    return 1;
  }
  return 0;
});

export function deserializeSignedTransaction(transaction: Uint8Array): SignedTransaction {
  const deserializer = new Deserializer(transaction);
  const signedTransaction = SignedTransaction.deserialize(deserializer);
  return signedTransaction;
}

export function getTransactionHash(signedTransaction: SignedTransaction): Uint8Array {
  const serializer = new Serializer();
  signedTransaction.serialize(serializer);

  if (signedTransaction.raw_txn.payload instanceof TransactionPayloadEntryFunction) {
    const txHash = sha3_256
      .create()
      .update(sha3_256.create().update('DIEM::Transaction').digest())
      .update(new Uint8Array([0]))
      .update(serializer.toUint8Array())
      .digest();
    return txHash;
  }

  console.error(
    `unsupported transaction payload type: signedTransaction=${Buffer.from(signedTransaction.bcsToHex().toStringWithoutPrefix()).toString('hex').toUpperCase()}`,
  );
  throw new Error('unsupported transaction payload type');
}
