import {
  Field,
  InterfaceType,
  ObjectType,
  createUnionType,
} from "@nestjs/graphql";
import BN from "bn.js";
import { Decimal } from "decimal.js";
import { V0_TIMESTAMP } from "../constants.js";

@InterfaceType("AbstractTransaction")
export abstract class GqlAbstractTransaction {
  @Field(() => BN)
  version: BN;

  @Field(() => BN)
  timestamp: BN;
}

type AbstractTransaction =
  | GqlGenesisTransaction
  | GqlBlockMetadataTransaction
  | GqlUserTransaction;

interface AbstractTransactionInput {
  version: BN;
  timestamp: BN;
}

type GqlBlockMetadataTransactionInput = AbstractTransactionInput & {
  epoch: BN;
};

@ObjectType("GenesisTransaction", {
  implements: () => [GqlAbstractTransaction],
})
export class GqlGenesisTransaction implements GqlAbstractTransaction {
  public constructor() {
    this.version = new BN("0");
    this.timestamp = new BN(V0_TIMESTAMP * 1e6);
  }

  @Field(() => BN)
  public version: BN;

  @Field()
  public timestamp: BN;
}

@ObjectType("BlockMetadataTransaction", {
  implements: () => [GqlAbstractTransaction],
})
export class GqlBlockMetadataTransaction implements GqlAbstractTransaction {
  public constructor(input: GqlBlockMetadataTransactionInput) {
    this.timestamp = input.timestamp;
    this.version = input.version;
    this.epoch = input.epoch;
  }

  @Field(() => BN)
  public version: BN;

  @Field(() => BN)
  public epoch: BN;

  @Field(() => BN)
  public timestamp: BN;
}

type GqlUserTransactionInput = AbstractTransactionInput & {
  sender: Buffer;
  success: boolean;
  moduleAddress: Buffer;
  moduleName: string;
  functionName: string;
  arguments: string;
};

@ObjectType("UserTransaction", {
  implements: () => [GqlAbstractTransaction],
})
export class GqlUserTransaction implements GqlAbstractTransaction {
  @Field(() => BN)
  public version: BN;

  @Field(() => BN)
  public timestamp: BN;

  @Field()
  public success: boolean;

  @Field(() => Buffer)
  sender: Buffer;

  @Field(() => Buffer)
  moduleAddress: Buffer;

  @Field(() => String)
  moduleName: string

  @Field(() => String)
  functionName: string;

  @Field(() => String)
  arguments: string;

  public constructor(input: GqlUserTransactionInput) {
    this.sender = input.sender;
    this.timestamp = input.timestamp;
    this.version = input.version;
    this.success = input.success;
    this.moduleAddress = input.moduleAddress;
    this.moduleName = input.moduleName;
    this.functionName = input.functionName;
    this.arguments = input.arguments;
  }
}

export const GqlTransaction = createUnionType({
  name: "Transaction",
  types: () =>
    [
      GqlGenesisTransaction,
      GqlBlockMetadataTransaction,
      GqlUserTransaction,
    ] as const,
});

interface GqlMovementInput {
  amount: Decimal;
  unlockedAmount: Decimal;
  lockedAmount: Decimal;

  balance: Decimal;
  lockedBalance: Decimal;
  version: BN;
  transaction: AbstractTransaction;
}

@ObjectType("Movement")
export class GqlMovement {
  public constructor(input: GqlMovementInput) {
    this.balance = input.balance;
    this.lockedBalance = input.lockedBalance;

    this.unlockedAmount = input.unlockedAmount;
    this.lockedAmount = input.lockedAmount;
    this.amount = input.amount;

    this.version = input.version;
    this.transaction = input.transaction;
  }

  @Field(() => Decimal)
  public amount: Decimal;

  @Field(() => Decimal)
  public unlockedAmount: Decimal;

  @Field(() => Decimal)
  public lockedAmount: Decimal;

  @Field(() => Decimal)
  public balance: Decimal;

  @Field(() => Decimal)
  public lockedBalance: Decimal;

  @Field(() => BN)
  public version: BN;

  @Field(() => GqlAbstractTransaction)
  public transaction: AbstractTransaction;
}
