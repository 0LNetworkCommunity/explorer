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
  handle: string | null;
  balance?: number;
  unlocked?: number;
  votingPower: BN;
  vfnStatus?: String | null;
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
    this.handle = input.handle;
    this.balance = input.balance;
    this.unlocked = input.unlocked;
    this.votingPower = input.votingPower;
    this.vfnStatus = input.vfnStatus;
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
  public handle: string | null;

  @Field(() => String, { nullable: true })
  public city?: string | null;

  @Field(() => String, { nullable: true })
  public country?: string | null;

  @Field(() => BN)
  public votingPower: BN;

  @Field(() => String, { nullable: true })
  public vfnStatus?: String | null;

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

interface VouchInput {
  address: string;
  epoch: number;
}

@ObjectType()
export class Vouch {
  public constructor(input: VouchInput) {
    this.address = input.address;
    this.epoch = input.epoch;
  }

  @Field(() => String)
  address: string;

  @Field(() => Number)
  epoch: number;
}

interface VouchDetailsInput {
  address: string;
  handle?: string | null;
  family?: string | null;
  compliant: boolean;
  epoch: number;
  epochsToExpire: number;
  inSet: boolean;
}

@ObjectType()
export class VouchDetails {
  public constructor(input: VouchDetailsInput) {
    this.address = input.address;
    this.handle = input.handle;
    this.family = input.family;
    this.compliant = input.compliant;
    this.epoch = input.epoch;
    this.epochsToExpire = input.epochsToExpire;
    this.inSet = input.inSet;
  }

  @Field(() => String)
  address: string;

  @Field(() => String, { nullable: true })
  handle?: string | null;

  @Field(() => String, { nullable: true })
  family?: string | null;

  @Field(() => Boolean)
  compliant: boolean;

  @Field(() => Number)
  epoch: number;

  @Field(() => Number)
  epochsToExpire: number;

  @Field(() => Boolean)
  inSet: boolean;
}

interface VfnStatusInput {
  address: string;
  status: string;
}

@ObjectType()
export class VfnStatus {
  public constructor(input: VfnStatusInput) {
    this.address = input.address;
    this.status = input.status;
  }

  @Field(() => String)
  address: string;

  @Field(() => String)
  status: string;
}

interface ValidatorVouchesInput {
  address: string;
  handle: string | null;
  family: string | null;
  inSet: boolean;
  validVouches: number;
  compliant: boolean;
  receivedVouches: VouchDetails[];
  givenVouches: VouchDetails[];
}

@ObjectType()
export class ValidatorVouches {
  public constructor(input: ValidatorVouchesInput) {
    this.address = input.address;
    this.handle = input.handle;
    this.family = input.family;
    this.inSet = input.inSet;
    this.validVouches = input.validVouches;
    this.compliant = input.compliant;
    this.receivedVouches = input.receivedVouches;
    this.givenVouches = input.givenVouches;
  }

  @Field(() => String)
  address: string;

  @Field(() => String, { nullable: true })
  handle?: string | null;

  @Field(() => String, { nullable: true })
  family?: string | null;

  @Field(() => Boolean)
  inSet: boolean;

  @Field(() => Number)
  validVouches: number;

  @Field(() => Boolean)
  compliant: boolean;

  @Field(() => [VouchDetails])
  receivedVouches: VouchDetails[];

  @Field(() => [VouchDetails])
  givenVouches: VouchDetails[];
}

interface ValidVouchesInput {
  valid: number;
  compliant: boolean;
}

@ObjectType()
export class ValidVouches {
  public constructor(input: ValidVouchesInput) {
    this.valid = input.valid;
    this.compliant = input.compliant;
  }

  @Field(() => Number)
  valid: number;

  @Field(() => Boolean)
  compliant: boolean;
}

interface ThermostatMeasureInput {
  nextEpoch: number;
  amount: number;
  percentage: number; // 0-100
  didIncrease: boolean;
}

@ObjectType()
export class ThermostatMeasure {
  public constructor(input: ThermostatMeasureInput) {
    this.nextEpoch = input.nextEpoch;
    this.amount = input.amount;
    this.percentage = input.percentage;
    this.didIncrease = input.didIncrease;
  }

  @Field(() => Number)
  nextEpoch: number;

  @Field(() => Number)
  amount: number;

  @Field(() => Number)
  percentage: number;

  @Field(() => Boolean)
  didIncrease: boolean;
}

interface ValidatorUtilsInput {
  vouchPrice: number;
  entryFee: number;
  clearingBid: number;
  netReward: number;
  //thermostatMeasure: ThermostatMeasure;
}

@ObjectType()
export class ValidatorUtils {
  public constructor(input: ValidatorUtilsInput) {
    this.vouchPrice = input.vouchPrice;
    this.entryFee = input.entryFee;
    this.clearingBid = input.clearingBid;
    this.netReward = input.netReward;
    //this.thermostatMeasure = input.thermostatMeasure;
  }

  @Field(() => Number)
  vouchPrice: number;

  @Field(() => Number)
  entryFee: number;

  @Field(() => Number)
  clearingBid: number;

  @Field(() => Number)
  netReward: number;

  /*
  @Field(() => ThermostatMeasure)
  thermostatMeasure: ThermostatMeasure;*/
}
