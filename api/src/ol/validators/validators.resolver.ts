import { Query, Resolver } from "@nestjs/graphql";
import _ from "lodash";
import Bluebird from "bluebird";
import BN from "bn.js";

import { OlService } from "../ol.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { GqlValidator } from "../models/validator.model.js";

@Resolver()
export class ValidatorsResolver {
  public constructor(
    private readonly olService: OlService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => [GqlValidator])
  async validators(): Promise<GqlValidator[]> {
    const validatorSet = await this.olService.getValidatorSet();
    const nodes = await this.prisma.node.findMany({
      select: {
        ip: true,
        city: true,
        country: true,
      },
    });

    const currentValidators = await Bluebird.map(
      validatorSet.activeValidators,
      async (validator) => {
        const grade = await this.olService.getValidatorGrade(validator.addr);
        const valIp =
          validator.config.networkAddresses &&
          validator.config.networkAddresses.split("/")[2];
        const node = nodes.find((node) => node["ip"] == valIp);
        const city = node && node["city"] ? node["city"] : undefined;
        const country = node && node["country"] ? node["country"] : undefined;

        return new GqlValidator({
          address: validator.addr,
          votingPower: validator.votingPower,
          grade,
          inSet: true,
          index: validator.config.validatorIndex,
          networkAddresses: validator.config.networkAddresses,
          fullnodeAddresses: validator.config.fullnodeAddresses,
          city,
          country,
        });
      },
    );

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
        grade: grade,
        inSet: false,
        index: new BN(-1),
        // city: city,
        // country: country
      });
    });

    return [...currentValidators, ...eligibleValidators];
  }
}
