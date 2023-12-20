import { Field, ObjectType } from '@nestjs/graphql';

interface GqlValidatorGradeInpt {
  compliant: boolean;
  proposedBlocks: number;
  failedBlocks: number;
  ratio: number;
}

@ObjectType('ValidatorGrade')
export class GqlValidatorGrade {
  public constructor(input: GqlValidatorGradeInpt) {
    this.compliant = input.compliant;
    this.proposedBlocks = input.proposedBlocks;
    this.failedBlocks = input.failedBlocks;
    this.ratio = input.ratio;
  }

  @Field(() => Boolean)
  public compliant: boolean;

  @Field(() => Number)
  public proposedBlocks: number;

  @Field(() => Number)
  public failedBlocks: number;

  @Field(() => Number)
  public ratio: number;
}

interface GqlValidatorInput {
  address: string;
  votingPower: number;
  failedProposals: number;
  successfulProposals: number;
  inSet: boolean;
  networkAddresses?: string;
  fullnodeAddresses?: string;
}

@ObjectType('Validator')
export class GqlValidator {
  public constructor(input: GqlValidatorInput) {
    this.address = input.address;
    this.votingPower = input.votingPower;
    this.failedProposals = input.failedProposals;
    this.successfulProposals = input.successfulProposals;
    this.inSet = input.inSet;
    this.networkAddresses = input.networkAddresses;
    this.fullnodeAddresses = input.fullnodeAddresses;
  }

  @Field(() => Boolean)
  public inSet: boolean;

  @Field(() => String)
  public address: string;

  @Field(() => String, { nullable: true })
  public networkAddresses?: string;

  @Field(() => String, { nullable: true })
  public fullnodeAddresses?: string;

  @Field(() => Number)
  public votingPower: number;

  @Field(() => Number)
  public failedProposals: number;

  @Field(() => Number)
  public successfulProposals: number;
}

interface GqlVouchInput {
  epoch: number;
  address: string;
  inSet: boolean;
}

@ObjectType('Vouch')
export class GqlVouch {
  public constructor(input: GqlVouchInput) {
    this.epoch = input.epoch;
    this.address = input.address;
    this.inSet = input.inSet;
  }

  @Field(() => Number)
  public epoch: number;

  @Field(() => String)
  public address: string;

  @Field(() => Boolean)
  public inSet: boolean;
}

interface GqlValidatorCurrentBidInput {
  currentBid: number;
  expirationEpoch: number;
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