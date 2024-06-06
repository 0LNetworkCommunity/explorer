import { Injectable } from "@nestjs/common";
// src/validators/validators.service.ts
import Bluebird, { all } from "bluebird";
import BN from "bn.js";
import { OlService } from "../ol.service.js";
import { AccountsService } from "../accounts/accounts.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { GqlValidator, GqlVouch } from "../models/validator.model.js";
import { parseAddress } from "../../utils.js";

@Injectable()
export class ValidatorsService {
  public constructor(
    private readonly olService: OlService,
    private readonly accountsService: AccountsService,
    private readonly prisma: PrismaService,
  ) {}

  public async getValidators(): Promise<GqlValidator[]> {
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
        const valIp =
          validator.config.networkAddresses &&
          validator.config.networkAddresses.split("/")[2];
        const node = nodes.find((node) => node["ip"] == valIp);
        const city = node && node["city"] ? node["city"] : "";
        const country = node && node["country"] ? node["country"] : "";

        return {
          address: validator.addr,
          votingPower: validator.votingPower,
          inSet: true,
          index: validator.config.validatorIndex,
          networkAddresses: validator.config.networkAddresses,
          fullnodeAddresses: validator.config.fullnodeAddresses,
          city: city,
          country: country,
        };
      },
    );

    let eligible = await this.olService.getEligibleValidators();
    const eligibleValidators = eligible
      .filter(
        (address) =>
          !currentValidators.find((it) => !it.address.compare(address)),
      )
      .map((address) => {
        return {
          address,
          votingPower: new BN(0),
          inSet: false,
          index: new BN(-1),
          city: null,
          country: null,
        };
      });

    let allValidators = [...currentValidators, ...eligibleValidators];
    return await Bluebird.map(allValidators, async (validator) => {
      const balance = await this.accountsService.getBalance({
        address: validator.address,
      });
      const slowWallet = await this.accountsService.getSlowWallet({
        address: validator.address,
      });
      const unlocked = Number(slowWallet?.unlocked);
      const grade = await this.olService.getValidatorGrade(validator.address);
      const vouches = await this.getVouches(validator.address);
      const currentBid = await this.olService.getCurrentBid(validator.address);
      return new GqlValidator({
        inSet: validator.inSet,
        index: validator.index,
        address: validator.address.toString("hex").toLocaleUpperCase(),
        votingPower: validator.votingPower,
        balance: Number(balance),
        unlocked: unlocked,
        grade: grade,
        vouches: vouches,
        currentBid: currentBid,
        city: validator.city || "",
        country: validator.country || "",
      });
    });
  }

  public async getVouches(address: Buffer): Promise<GqlVouch[]> {
    const vouchesRes = await this.olService.aptosClient.getAccountResource(
      `0x${address.toString("hex")}`,
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
}
