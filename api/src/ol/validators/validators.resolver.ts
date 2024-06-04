import { Query, Resolver } from "@nestjs/graphql";
import _ from "lodash";
import Bluebird from "bluebird";
import BN from "bn.js";

import { OlService } from "../ol.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { GqlValidator } from "../models/validator.model.js";

interface ValidatorPerformance {
  validators: {
    failed_proposals: string;
    successful_proposals: string;
  }[];
}

@Resolver()
export class ValidatorsResolver {
  public constructor(
    private readonly olService: OlService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => [GqlValidator])
  async validators(): Promise<GqlValidator[]> {
    const validatorPerformanceRes =
      await this.olService.aptosClient.getAccountResource(
        "0x01",
        "0x1::stake::ValidatorPerformance",
      );

    const validatorSet = await this.olService.getValidatorSet();

    const nodes = await this.prisma.node.findMany({
      select: {
        ip: true,
        city: true,
        country: true,
      },
    });

    const validatorPerformances =
      validatorPerformanceRes.data as ValidatorPerformance;

    const currentValidators = validatorSet.activeValidators.map((validator) => {
      const validatorPerformance =
        validatorPerformances.validators[
          validator.config.validatorIndex.toNumber()
        ];

      const valIp =
        validator.config.networkAddresses &&
        validator.config.networkAddresses.split("/")[2];
      const node = nodes.find((node) => node["ip"] == valIp);
      const city = node && node["city"] ? node["city"] : "";
      const country = node && node["country"] ? node["country"] : "";

      return new GqlValidator({
        address: validator.addr,
        votingPower: validator.votingPower,
        failedProposals: new BN(validatorPerformance.failed_proposals),
        successfulProposals: new BN(validatorPerformance.successful_proposals),
        inSet: true,
        index: validator.config.validatorIndex,
        networkAddresses: validator.config.networkAddresses,
        fullnodeAddresses: validator.config.fullnodeAddresses,
        city: city,
        country: country,
      });
    });

    let eligible = await this.olService.getEligibleValidators();
    eligible = eligible.filter(
      (address) => !currentValidators.find((it) => it.address.equals(address)),
    );

    const eligibleValidators = await Bluebird.map(eligible, async (address) => {
      const grade = await this.olService.getValidatorGrade(address);

      // Ready to fetch city and country for inactive validators
      /*
      const config = await this.olService.getValidatorConfig(address);
      const valIp =
        config.network_addresses && config.network_addresses.split("/")[2];
      const node = nodes.find((node) => node["ip"] == valIp);
      const city = node && node["city"] ? node["city"] : "";
      const country = node && node["country"] ? node["country"] : "";
      */

      return new GqlValidator({
        address,
        votingPower: new BN(0),
        failedProposals: new BN(grade.failedBlocks),
        successfulProposals: new BN(grade.proposedBlocks),
        inSet: false,
        index: new BN(-1),
        city: "",
        country: "",
      });
    });

    return [...currentValidators, ...eligibleValidators];
  }
}
