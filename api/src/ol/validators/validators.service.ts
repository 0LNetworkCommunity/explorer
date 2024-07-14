import { Injectable } from '@nestjs/common';
import Bluebird from 'bluebird';
import BN from 'bn.js';

import { OlService } from '../ol.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Validator, GqlVouch } from '../models/validator.model.js';
import { parseAddress } from '../../utils.js';

@Injectable()
export class ValidatorsService {
  public constructor(
    private readonly olService: OlService,
    private readonly prisma: PrismaService,
  ) {}

  public async getValidators(): Promise<Validator[]> {
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
          validator.config.networkAddresses && validator.config.networkAddresses.split('/')[2];
        const node = nodes.find((node) => node['ip'] == valIp);
        const city = node && node['city'] ? node['city'] : null;
        const country = node && node['country'] ? node['country'] : null;
        const grade = await this.olService.getValidatorGrade(validator.addr);

        return {
          address: validator.addr,
          votingPower: validator.votingPower,
          inSet: true,
          index: validator.config.validatorIndex,
          networkAddresses: validator.config.networkAddresses,
          fullnodeAddresses: validator.config.fullnodeAddresses,
          city,
          country,
          grade,
          auditQualification: null,
        };
      },
    );

    const eligible = await this.olService.getEligibleValidators();
    const eligibleCurrent = eligible.filter(
      (address) => !currentValidators.find((it) => !it.address.compare(address)),
    );

    const eligibleValidators = await Promise.all(
      eligibleCurrent.map(async (address) => {
        return {
          address,
          votingPower: new BN(0),
          inSet: false,
          index: new BN(-1),
          auditQualification: await this.getAuditQualification(address),
          grade: null,
          city: null,
          country: null,
        };
      }),
    );

    let allValidators = [...currentValidators, ...eligibleValidators];
    return await Promise.all(
      allValidators.map(async (validator) => {
        const balance = await this.olService.getAccountBalance(validator.address);
        const slowWallet = await this.olService.getSlowWallet(validator.address);
        const unlocked = Number(slowWallet?.unlocked);

        const vouches = await this.getVouches(validator.address);
        const currentBid = await this.olService.getCurrentBid(validator.address);
        return new Validator({
          inSet: validator.inSet,
          index: validator.index,
          address: validator.address.toString('hex').toLocaleUpperCase(),
          votingPower: validator.votingPower,
          balance: Number(balance),
          unlocked: unlocked,
          grade: validator.grade,
          vouches: vouches,
          currentBid: currentBid,
          city: validator.city,
          country: validator.country,
          auditQualification: validator.auditQualification,
        });
      }),
    );
  }
  public async getAuditQualification(address: Buffer): Promise<[string]> {
    const auditQualification = await this.olService.aptosClient.view({
      function: '0x1::proof_of_fee::audit_qualification',
      type_arguments: [],
      arguments: [`0x${address.toString('hex')}`],
    });
    return auditQualification[0] as [string];
  }

  public async getVouches(address: Buffer): Promise<GqlVouch[]> {
    const allVouchesRes = await this.olService.aptosClient.getAccountResource(
      `0x${address.toString('hex')}`,
      '0x1::vouch::MyVouches',
    );

    const validVouchesRes = await this.olService.aptosClient.view({
      function: '0x1::vouch::true_friends',
      type_arguments: [],
      arguments: [`0x${address.toString('hex')}`],
    });

    const allVouches = allVouchesRes.data as {
      epoch_vouched: string[];
      my_buddies: string[];
    };

    const all = allVouches.my_buddies.map((address, index) => {
      return {
        address: parseAddress(address).toString('hex').toLocaleUpperCase(),
        epoch: Number(allVouches.epoch_vouched[index]),
      };
    });

    let validVouches = validVouchesRes[0] as string[];
    validVouches = validVouches.map((address) =>
      parseAddress(address).toString('hex').toLocaleUpperCase(),
    );
    const activeVouches = all.filter((vouch) => validVouches.includes(vouch.address));

    return activeVouches.map((vouch) => {
      return new GqlVouch({
        address: parseAddress(vouch.address).toString('hex').toLocaleUpperCase(),
        epoch: Number(vouch.epoch),
      });
    });
  }
}
