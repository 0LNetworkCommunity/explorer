import { Parent, ResolveField, Resolver } from "@nestjs/graphql";
import BN from "bn.js";

import { OlService } from "../ol.service.js";
import {
  GqlValidator,
  GqlValidatorCurrentBid,
  GqlValidatorGrade,
  GqlVouch,
} from "../models/validator.model.js";
import { GqlAccount } from "../models/account.model.js";
import { parseAddress } from "../../utils.js";

@Resolver(GqlValidator)
export class ValidatorResolver {
  public constructor(private readonly olService: OlService) {}

  @ResolveField(() => GqlAccount)
  public account(@Parent() validator: GqlValidator): GqlAccount {
    return new GqlAccount(validator.address);
  }

  @ResolveField(() => [GqlVouch])
  public async vouches(@Parent() validator: GqlValidator): Promise<GqlVouch[]> {
    const vouchesRes = await this.olService.aptosClient.getAccountResource(
      `0x${validator.address.toString("hex")}`,
      "0x1::vouch::MyVouches",
    );
    const vouches = vouchesRes.data as {
      epoch_vouched: string[];
      my_buddies: string[];
    };
    return vouches.my_buddies.map((address, index) => {
      return new GqlVouch({
        address: parseAddress(address),
        epoch: new BN(vouches.epoch_vouched[index]),
        inSet: true,
      });
    });
  }

  @ResolveField(() => GqlValidatorGrade)
  public async grade(
    @Parent() validator: GqlValidator,
  ): Promise<GqlValidatorGrade> {
    const grade = await this.olService.getValidatorGrade(validator.address);
    return new GqlValidatorGrade({
      compliant: grade.compliant,
      proposedBlocks: grade.proposedBlocks,
      failedBlocks: grade.failedBlocks,
    });
  }

  @ResolveField(() => GqlValidatorCurrentBid)
  public async currentBid(
    @Parent() validator: GqlValidator,
  ): Promise<GqlValidatorCurrentBid> {
    const currentBid = await this.olService.getCurrentBid(validator.address);
    return new GqlValidatorCurrentBid({
      currentBid: currentBid.currentBid,
      expirationEpoch: currentBid.expirationEpoch,
    });
  }
}
