import { Query, Resolver } from "@nestjs/graphql";
import _ from "lodash";
import { OlService } from "./ol.service.js";
import { GqlValidator } from "./models/validator.model.js";
import Bluebird from "bluebird";

interface ValidatorSet {
  active_validators: {
    addr: string;
    config: {
      consensus_pubkey: string;
      fullnode_addresses: string;
      network_addresses: string;
      validator_index: string;
    };
    voting_power: string;
  }[];
}

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
    const [validatorSetRes, validatorPerformanceRes] = await Promise.all([
      this.olService.aptosClient.getAccountResource(
        "0x01",
        "0x1::stake::ValidatorSet",
      ),
      this.olService.aptosClient.getAccountResource(
        "0x01",
        "0x1::stake::ValidatorPerformance",
      ),
    ]);

    const validatorSet = validatorSetRes.data as ValidatorSet;
    const validatorPerformances =
      validatorPerformanceRes.data as ValidatorPerformance;

    const currentValidators = validatorSet.active_validators.map(
      (validator) => {
        const validatorIndex = parseInt(validator.config.validator_index, 10);
        const validatorPerformance =
          validatorPerformances.validators[validatorIndex];

        return new GqlValidator({
          address: validator.addr.substring(2).toUpperCase(),
          votingPower: parseInt(validator.voting_power, 10),
          failedProposals: parseInt(validatorPerformance.failed_proposals, 10),
          successfulProposals: parseInt(
            validatorPerformance.successful_proposals,
            10,
          ),
          inSet: true,
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
