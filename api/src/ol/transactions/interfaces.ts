import BN from 'bn.js';
import { PendingTransactionStatus } from '@prisma/client';
import { SignedTransaction } from '@aptos-labs/ts-sdk';

import { UserTransaction } from '../models/UserTransaction.js';
import { BlockMetadataTransaction } from '../models/BlockMetadataTransaction.js';
import { ScriptUserTransaction } from '../models/ScriptUserTransaction.js';
import { GenesisTransaction } from '../models/GenesisTransaction.js';
import { AbstractTransaction } from '../models/Transaction.js';

export interface ITransactionsRepository {
  newTransaction(signedTransaction: SignedTransaction): Promise<boolean>;
  getWalletTransactions(address: Uint8Array): Promise<ITransaction[]>;
  getTransactionByHash(hash: Uint8Array): Promise<ITransaction>;
  getTransactionsExpiredAfter(timestamp: number, limit: number): Promise<Uint8Array[]>;
  updateTransactionStatus(
    hash: Uint8Array,
    from: PendingTransactionStatus | undefined,
    to: PendingTransactionStatus,
  ): Promise<boolean>;
}

export interface ITransactionsService {
  newTransaction(signedTransaction: SignedTransaction): Promise<boolean>;
  getWalletTransactions(address: Uint8Array): Promise<ITransaction[]>;
  getTransactionByHash(hash: Uint8Array): Promise<ITransaction>;
  getTransactionsExpiredAfter(timestamp: number, limit: number): Promise<Uint8Array[]>;
  updateTransactionStatus(
    hash: Uint8Array,
    from: PendingTransactionStatus | undefined,
    to: PendingTransactionStatus,
  ): Promise<boolean>;
}

export interface TransactionArgs {
  hash: Uint8Array;
  sender: Uint8Array;
  status: PendingTransactionStatus;
}

export interface ITransaction {
  hash: Uint8Array;
  sender: Uint8Array;

  init(args: TransactionArgs): void;
}

export interface ITransactionsFactory {
  createTransaction(args: TransactionArgs): Promise<ITransaction>;
}

export interface IOnChainTransactionsRepository {
  getTransactionsByHashes(hashes: Uint8Array[]): Promise<Map<string, AbstractTransaction>>;

  getUserTransactionsByVersions(versions: number[]): Promise<Map<string, UserTransaction>>;

  getBlockMetadataTransactionsByVersions(
    versions: number[],
  ): Promise<Map<string, BlockMetadataTransaction>>;

  getScriptUserTransactionsByVersions(
    versions: number[],
  ): Promise<Map<string, ScriptUserTransaction>>;

  getGenesisTransactionsByVersions(versions: number[]): Promise<Map<string, GenesisTransaction>>;

  getTransactionTimestamp(version: BN): Promise<BN | null>;
}

export interface GenesisTransactionDbEntity {
  version: string;
  hash: string;
}

export interface UserTransactionDbEntity {
  hash: string;
  sender: string;
  version: string;
  // gas_used: string;
  success: boolean;
  // vm_status: string;
  // sequence_number: string;
  // max_gas_amount: string;
  // gas_unit_price: string;
  // expiration_timestamp: string;
  module_address: string;
  module_name: string;
  function_name: string;
  // type_arguments: string;
  arguments: string;
  timestamp: string;
}

export interface BlockMetadataTransactionDbEntity {
  id: string;
  hash: string;
  version: string;
  epoch: string;
  timestamp: string;
}

export interface ScriptUserTransactionDbEntity {
  version: string;
  hash: string;
  gas_used: string;
  success: boolean;
  vm_status: string;
  sender: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  expiration_timestamp: string;
  type_arguments: string;
  arguments: string;
  abi: string;
  timestamp: string;
}
