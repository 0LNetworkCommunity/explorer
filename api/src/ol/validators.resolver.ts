import { Query, Resolver } from "@nestjs/graphql";
import _ from "lodash";
import Bluebird from "bluebird";

import { OlService } from "./ol.service.js";
import { GqlValidator } from "./models/validator.model.js";

interface ValidatorPerformance {
  validators: {
    failed_proposals: string;
    successful_proposals: string;
  }[];
}

@Resolver()
export class ValidatorsResolver {
  public constructor(private readonly olService: OlService) {}

  @Query(() => [GqlValidator])
  async validators(): Promise<GqlValidator[]> {
    const validatorPerformanceRes =
      await this.olService.aptosClient.getAccountResource(
        "0x01",
        "0x1::stake::ValidatorPerformance",
      );

    const validatorSet = await this.olService.getValidatorSet();
    const validatorPerformances =
      validatorPerformanceRes.data as ValidatorPerformance;

    const currentValidators = validatorSet.activeValidators.map(
      (validator) => {
        const validatorPerformance =
          validatorPerformances.validators[validator.config.validatorIndex];

        return new GqlValidator({
          address: validator.addr.substring(2).toUpperCase(),
          votingPower: validator.votingPower,
          failedProposals: parseInt(validatorPerformance.failed_proposals, 10),
          successfulProposals: parseInt(
            validatorPerformance.successful_proposals,
            10,
          ),
          inSet: true,
          networkAddresses: validator.config.networkAddresses,
          fullnodeAddresses: validator.config.fullnodeAddresses,
        });
      },
    );

    let eligible = await this.olService.getEligibleValidators();
    eligible = eligible.filter((address) =>
      !currentValidators.find((it) => it.address === address),
    );

    const eligibleValidators = await Bluebird.map(eligible, async (address) => {
      const grade = await this.olService.getValidatorGrade(address);
      return new GqlValidator({
        address: address.substring(2).toUpperCase(),
        votingPower: 0,
        failedProposals: grade.failedBlocks,
        successfulProposals: grade.proposedBlocks,
        inSet: false,
      });
    });

    return [...currentValidators, ...eligibleValidators];
  }
}
