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
        const grade = await this.olService.getValidatorGrade(validator.addr);

        return {
          address: validator.addr,
          votingPower: validator.votingPower,
          inSet: true,
          index: validator.config.validatorIndex,
          networkAddresses: validator.config.networkAddresses,
          fullnodeAddresses: validator.config.fullnodeAddresses,
          city: city,
          country: country,
          grade: grade,
          audit_qualification: null,
        };
      },
    );

    let eligible = await this.olService.getEligibleValidators();
    const eligibleCurrent = eligible.filter(
      (address) =>
        !currentValidators.find((it) => !it.address.compare(address)),
    );

    const eligibleValidators = await Bluebird.map(
      eligibleCurrent,
      async (address) => {
        return {
          address,
          votingPower: new BN(0),
          inSet: false,
          index: new BN(-1),
          audit_qualification: await this.getAuditQualification(address),
          grade: null,
          city: null,
          country: null,
        };
      },
    );

    let allValidators = [...currentValidators, ...eligibleValidators];
    return await Bluebird.map(allValidators, async (validator) => {
      const balance = await this.accountsService.getBalance({
        address: validator.address,
      });
      const slowWallet = await this.accountsService.getSlowWallet({
        address: validator.address,
      });
      const unlocked = Number(slowWallet?.unlocked);

      const vouches = await this.getVouches(validator.address);
      const currentBid = await this.olService.getCurrentBid(validator.address);
      return new GqlValidator({
        inSet: validator.inSet,
        index: validator.index,
        address: validator.address.toString("hex").toLocaleUpperCase(),
        votingPower: validator.votingPower,
        balance: Number(balance),
        unlocked: unlocked,
        grade: validator.grade ?? null,
        vouches: vouches,
        currentBid: currentBid,
        city: validator.city || "",
        country: validator.country || "",
        audit_qualification: validator.audit_qualification ?? null,
      });
    });
  }
  public async getAuditQualification(address: Buffer): Promise<[string]> {
    const auditQualification = await this.olService.aptosClient.view({
      function: "0x1::proof_of_fee::audit_qualification",
      type_arguments: [],
      arguments: [`0x${address.toString("hex")}`],
    });
    return auditQualification[0] as [string];
  }

  public async getVouches(address: Buffer): Promise<GqlVouch[]> {
    const allVouchesRes = await this.olService.aptosClient.getAccountResource(
      `0x${address.toString("hex")}`,
      "0x1::vouch::MyVouches",
    );

    const validVouchesRes = await this.olService.aptosClient.view({
      function: "0x1::vouch::true_friends",
      type_arguments: [],
      arguments: [`0x${address.toString("hex")}`],
    });

    const allVouches = allVouchesRes.data as {
      epoch_vouched: string[];
      my_buddies: string[];
    };

    const all = allVouches.my_buddies.map((address, index) => {
      return {
        address: parseAddress(address).toString("hex").toLocaleUpperCase(),
        epoch: Number(allVouches.epoch_vouched[index]),
      };
    });

    let validVouches = validVouchesRes[0] as string[];
    validVouches = validVouches.map((address) =>
      parseAddress(address).toString("hex").toLocaleUpperCase(),
    );
    const activeVouches = all.filter((vouch) =>
      validVouches.includes(vouch.address),
    );

    return activeVouches.map((vouch) => {
      return new GqlVouch({
        address: parseAddress(vouch.address)
          .toString("hex")
          .toLocaleUpperCase(),
        epoch: Number(vouch.epoch),
      });
    });
  }
}
