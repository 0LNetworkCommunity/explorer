import { Field, ObjectType } from '@nestjs/graphql';
import BN from 'bn.js';

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
  vouches: GqlVouch[];
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

  @Field(() => [GqlVouch], { nullable: true })
  public vouches?: GqlVouch[];

  @Field(() => GqlValidatorCurrentBid, { nullable: true })
  public currentBid?: GqlValidatorCurrentBid;

  @Field(() => Number, { nullable: true })
  public balance?: number;

  @Field(() => Number, { nullable: true })
  public unlocked?: number;

  @Field(() => [String], { nullable: true })
  public auditQualification?: [string] | null;
}

interface GqlVouchInput {
  epoch: number;
  address: string;
}

@ObjectType('Vouch')
export class GqlVouch {
  public constructor(input: GqlVouchInput) {
    this.epoch = input.epoch;
    this.address = input.address;
  }

  @Field(() => Number)
  public epoch: number;

  @Field(() => String)
  public address: string;
}
