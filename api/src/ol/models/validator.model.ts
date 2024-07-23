import { Field, ObjectType } from '@nestjs/graphql';
import BN from 'bn.js';

export interface IVoucherInput {
  address: string;
  epoch: number;
}

@ObjectType('Voucher')
export class Voucher {
  public constructor(input: IVoucherInput) {
    this.address = input.address;
    this.epoch = input.epoch;
  }

  @Field(() => String)
  public address: string;

  @Field(() => Number)
  public epoch: number;
}

interface IVouchesInput {
  valid: number;
  total: number;
  compliant: boolean;
  vouchers: Voucher[];
}

@ObjectType('Vouches')
export class Vouches {
  public constructor(input: IVouchesInput) {
    this.valid = input.valid;
    this.total = input.total;
    this.compliant = input.compliant;
    this.vouchers = input.vouchers;
  }

  @Field(() => Number)
  public valid: number;

  @Field(() => Number)
  public total: number;

  @Field(() => Boolean)
  public compliant: boolean;

  @Field(() => [Voucher])
  public vouchers: Voucher[];
}

@ObjectType('ValidatorCurrentBid')
export class GqlValidatorCurrentBid {
  public constructor(input: GqlValidatorCurrentBidInput) {
    this.currentBid = input.currentBid;
    this.expirationEpoch = input.expirationEpoch;
  }

  @Field(() => Number)
  public currentBid: number;

  @Field(() => Number)
  public expirationEpoch: number;
}

interface GqlValidatorCurrentBidInput {
  currentBid: number;
  expirationEpoch: number;
}

interface GqlValidatorGradeInput {
  compliant: boolean;
  proposedBlocks: number;
  failedBlocks: number;
}

@ObjectType('ValidatorGrade')
export class GqlValidatorGrade {
  public constructor(input: GqlValidatorGradeInput) {
    this.compliant = input.compliant;
    this.proposedBlocks = input.proposedBlocks;
    this.failedBlocks = input.failedBlocks;
  }

  @Field(() => Boolean)
  public compliant: boolean;

  @Field(() => Number)
  public proposedBlocks: number;

  @Field(() => Number)
  public failedBlocks: number;
}

interface ValidatorInput {
  inSet: boolean;
  index: BN;
  address: string;
  balance?: number;
  unlocked?: number;
  votingPower: BN;
  grade?: GqlValidatorGrade | null;
  vouches: Vouches;
  currentBid: GqlValidatorCurrentBid;
  city?: string | null;
  country?: string | null;
  auditQualification?: [string] | null;
}

@ObjectType()
export class Validator {
  public constructor(input: ValidatorInput) {
    this.inSet = input.inSet;
    this.index = input.index;
    this.address = input.address;
    this.balance = input.balance;
    this.unlocked = input.unlocked;
    this.votingPower = input.votingPower;
    this.grade = input.grade;
    this.vouches = input.vouches;
    this.currentBid = input.currentBid;
    this.city = input.city;
    this.country = input.country;
    this.auditQualification = input.auditQualification;
  }

  @Field(() => Boolean)
  public inSet: boolean;

  @Field(() => BN)
  public index: BN;

  @Field(() => String)
  public address: string;

  @Field(() => String, { nullable: true })
  public city?: string | null;

  @Field(() => String, { nullable: true })
  public country?: string | null;

  @Field(() => BN)
  public votingPower: BN;

  @Field(() => GqlValidatorGrade, { nullable: true })
  public grade?: GqlValidatorGrade | null;

  @Field(() => Vouches, { nullable: true })
  public vouches?: Vouches;

  @Field(() => GqlValidatorCurrentBid, { nullable: true })
  public currentBid?: GqlValidatorCurrentBid;

  @Field(() => Number, { nullable: true })
  public balance?: number;

  @Field(() => Number, { nullable: true })
  public unlocked?: number;

  @Field(() => [String], { nullable: true })
  public auditQualification?: [string] | null;
}
