import { Buffer } from 'buffer';
import BN from 'bn.js';
import { Decimal } from 'decimal.js';

export enum TransactionType {
  Genesis,
  BlockMetadata,
  User,
}

export interface AbstractTransactionInput {
  version: BN;
  timestamp: BN;
}

export class AbstractTransaction {
  public readonly type: TransactionType;

  public readonly version: BN;

  public readonly timestamp: BN;

  public constructor(input: { type: TransactionType } & AbstractTransactionInput) {
    this.type = input.type;
    this.version = input.version;
    this.timestamp = input.timestamp;
  }

  public get date(): Date {
    return new Date(this.timestamp.div(new BN(1e3)).toNumber());
  }
}

export interface GenesisTransactionInput extends AbstractTransactionInput {
  version: BN;
  timestamp: BN;
}

export class GenesisTransaction extends AbstractTransaction {
  public constructor(input: GenesisTransactionInput) {
    super({ type: TransactionType.Genesis, ...input });
  }
}

export interface BlockMetadataTransactionInput extends AbstractTransactionInput {
  epoch: BN;
}

export class BlockMetadataTransaction extends AbstractTransaction {
  public readonly epoch: BN;

  public constructor(input: BlockMetadataTransactionInput) {
    super({ type: TransactionType.BlockMetadata, ...input });
    this.epoch = input.epoch;
  }
}

export interface UserTransactionInput extends AbstractTransactionInput {
  success: boolean;
  moduleAddress: Buffer;
  moduleName: string;
  functionName: string;
  sender: Buffer;
  arguments: string;
}

export class UserTransaction extends AbstractTransaction {
  public success: boolean;
  public moduleAddress: Buffer;
  public moduleName: string;
  public functionName: string;
  public sender: Buffer;
  public arguments: string;

  public constructor(input: UserTransactionInput) {
    super({ type: TransactionType.User, ...input });
    this.sender = input.sender;
    this.success = input.success;
    this.moduleAddress = input.moduleAddress;
    this.moduleName = input.moduleName;
    this.functionName = input.functionName;
    this.arguments = input.arguments;
  }
}

export type Transaction = GenesisTransaction | BlockMetadataTransaction | UserTransaction;

export interface MovementInput {
  balance: Decimal;
  lockedBalance: Decimal;
  amount: Decimal;
  lockedAmount: Decimal;
  unlockedAmount: Decimal;
  transaction: Transaction;
  version: BN;
}

export class Movement {
  public readonly transaction: Transaction;

  public readonly balance: Decimal;

  public readonly lockedBalance: Decimal;

  public readonly amount: Decimal;

  public readonly lockedAmount: Decimal;

  public readonly unlockedAmount: Decimal;

  public readonly version: BN;

  public constructor(input: MovementInput) {
    this.transaction = input.transaction;
    this.balance = input.balance;
    this.lockedBalance = input.lockedBalance;
    this.amount = input.amount;
    this.lockedAmount = input.lockedAmount;
    this.unlockedAmount = input.unlockedAmount;
    this.version = input.version;
  }
}

export enum OrderDirection {
  ASC = "ASC",
  DESC = "DESC",
}