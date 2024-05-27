import { PendingTransactionStatus } from "@prisma/client";
import { SignedTransaction } from "@aptos-labs/ts-sdk";

import { GqlUserTransaction } from "../models/GqlUserTransaction.js";
import { GqlBlockMetadataTransaction } from "../models/GqlBlockMetadataTransaction.js";
import { GqlScriptUserTransaction } from "../models/GqlScriptUserTransaction.js";
import { GqlGenesisTransaction } from "../models/GqlGenesisTransaction.js";
import { AbstractTransaction } from "../models/GqlTransaction.js";

export interface ITransactionsRepository {
  newTransaction(signedTransaction: SignedTransaction): Promise<boolean>;
  getWalletTransactions(address: Uint8Array): Promise<ITransaction[]>;
  getTransactionByHash(hash: Uint8Array): Promise<ITransaction>;
  getTransactionsExpiredAfter(
    timestamp: number,
    limit: number,
  ): Promise<Uint8Array[]>;
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
  getTransactionsExpiredAfter(
    timestamp: number,
    limit: number,
  ): Promise<Uint8Array[]>;
  updateTransactionStatus(
    hash: Uint8Array,
    from: PendingTransactionStatus | undefined,
    to: PendingTransactionStatus,
  ): Promise<void>;
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
  getTransactionsByHashes(
    hashes: Uint8Array[],
  ): Promise<Map<string, AbstractTransaction>>;

  getUserTransactionsByVersions(
    versions: number[],
  ): Promise<Map<string, GqlUserTransaction>>;

  getBlockMetadataTransactionsByVersions(
    versions: number[],
  ): Promise<Map<string, GqlBlockMetadataTransaction>>;

  getScriptUserTransactionsByVersions(
    versions: number[],
  ): Promise<Map<string, GqlScriptUserTransaction>>;

  getGenesisTransactionsByVersions(
    versions: number[],
  ): Promise<Map<string, GqlGenesisTransaction>>;
}

export interface GenesisTransactionDbEntity {
  version: string;
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
