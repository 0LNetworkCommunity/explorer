import { Field, ObjectType, ID } from '@nestjs/graphql';

interface GqlUserTransactionInput {
  hash: string;
  version: number;
  gasUsed: number;
  success: boolean;
  vmStatus: string;
  sender: string;
  sequenceNumber: number;
  maxGasAmount: number;
  gasUnitPrice: number;
  expirationTimestamp: number;
  moduleAddress: string;
  moduleName: string;
  functionName: string;
  arguments: string[];
  timestamp: number;
}

@ObjectType('UserTransaction')
export class GqlUserTransaction {
  public constructor(input: GqlUserTransactionInput) {
    this.hash = input.hash;
    this.version = input.version;
    this.gasUsed = input.gasUsed;
    this.success = input.success;
    this.vmStatus = input.vmStatus;
    this.sender = input.sender;
    this.sequenceNumber = input.sequenceNumber;
    this.maxGasAmount = input.maxGasAmount;
    this.gasUnitPrice = input.gasUnitPrice;
    this.expirationTimestamp = input.expirationTimestamp;
    this.moduleAddress = input.moduleAddress;
    this.moduleName = input.moduleName;
    this.functionName = input.functionName;
    this.arguments = input.arguments;
    this.timestamp = input.timestamp;
  }

  @Field(() => String)
  public hash: string;

  @Field(() => Number)
  public version: number;

  @Field(() => Number)
  public gasUsed: number;

  @Field(() => Boolean)
  public success: boolean;

  @Field(() => String)
  public vmStatus: string;

  @Field(() => String)
  public sender: string;

  @Field(() => Number)
  public sequenceNumber: number;

  @Field(() => Number)
  public maxGasAmount: number;

  @Field(() => Number)
  public gasUnitPrice: number;

  @Field(() => Number)
  public expirationTimestamp: number;

  @Field(() => String)
  public moduleAddress: string;

  @Field(() => String)
  public moduleName: string;

  @Field(() => String)
  public functionName: string;

  @Field(() => [String])
  public arguments: string[];

  @Field(() => Number)
  public timestamp: number;
}

@ObjectType('UserTransactionCollection')
export class GqlUserTransactionCollection {
  public constructor(size: number, items: GqlUserTransaction[]) {
    this.size = size;
    this.items = items;
  }

  @Field(() => Number)
  public size: number;

  @Field(() => [GqlUserTransaction])
  public items: GqlUserTransaction[];
}
