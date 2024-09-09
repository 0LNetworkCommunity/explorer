import { Injectable } from '@nestjs/common';
import Bluebird from 'bluebird';
import BN from 'bn.js';
import { ConfigService } from '@nestjs/config';

import { OlService } from '../ol.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  Validator,
  Vouches,
  Voucher,
  ValidatorVouches,
  Vouch,
  VouchDetails,
  ValidVouches,
  ValidatorUtils,
  ThermostatMeasure,
} from '../models/validator.model.js';
import { parseAddress } from '../../utils.js';

import { join } from 'path';
import { readFileSync } from 'fs';
import { redisClient } from '../../redis/redis.service.js';
import { VALIDATORS_CACHE_KEY, VALIDATORS_VOUCHES_CACHE_KEY } from '../constants.js';

@Injectable()
export class ValidatorsService {
  private readonly cacheEnabled: boolean;
  public constructor(
    private readonly olService: OlService,
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.cacheEnabled = config.get<boolean>('cacheEnabled')!;
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      return JSON.parse(cachedData) as T;
    }
    return null;
  }

  private async setCache<T>(key: string, data: T): Promise<void> {
    await redisClient.set(key, JSON.stringify(data));
  }

  public async getValidators(): Promise<Validator[]> {
    if (this.cacheEnabled) {
      const cachedValidators = await this.getFromCache<Validator[]>(VALIDATORS_CACHE_KEY);
      if (cachedValidators) {
        return cachedValidators;
      }
    }

    const validators = await this.queryValidators();
    await this.setCache('validators', validators);

    return validators;
  }

  public async getValidatorsVouches(): Promise<ValidatorVouches[]> {
    if (this.cacheEnabled) {
      const cachedVouches = await this.getFromCache<ValidatorVouches[]>(
        VALIDATORS_VOUCHES_CACHE_KEY,
      );
      if (cachedVouches) {
        return cachedVouches;
      }
    }

    const vouches = await this.queryValidatorsVouches();
    await this.setCache(VALIDATORS_VOUCHES_CACHE_KEY, vouches);

    return vouches;
  }

  public async queryValidators(): Promise<Validator[]> {
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
          auditQualification: await this.getAuditQualification(validator.addr),
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

    let handles = this.loadValidatorHandles();
    let allValidators = [...currentValidators, ...eligibleValidators];
    return await Promise.all(
      allValidators.map(async (validator) => {
        const balance = await this.olService.getAccountBalance(validator.address);
        const slowWallet = await this.olService.getSlowWallet(validator.address);
        const unlocked = Number(slowWallet?.unlocked);

        let vouches = await this.getVouches(validator.address);

        const currentBid = await this.olService.getCurrentBid(validator.address);
        const addr = validator.address.toString('hex').toLocaleUpperCase();
        const handle = handles.get(addr) || null;
        return new Validator({
          inSet: validator.inSet,
          index: validator.index,
          address: addr,
          handle: handle,
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

  public async getVouches(address: Buffer): Promise<Vouches> {
    const receivedVouchesRes = await this.olService.aptosClient.getAccountResource(
      `0x${address.toString('hex')}`,
      '0x1::vouch::ReceivedVouches',
    );

    const receivedVouches = receivedVouchesRes.data as {
      epoch_vouched: string[];
      incoming_vouches: string[];
    };

    const all = receivedVouches.incoming_vouches.map((address, index) => {
      return {
        address: parseAddress(address).toString('hex').toLocaleUpperCase(),
        epoch: Number(receivedVouches.epoch_vouched[index]),
      };
    });

    const validVouchesRes = await this.olService.aptosClient.view({
      function: '0x1::proof_of_fee::get_valid_vouchers_in_set',
      type_arguments: [],
      arguments: [`0x${address.toString('hex')}`],
    });

    return new Vouches({
      compliant: validVouchesRes[0] as boolean,
      valid: Number(validVouchesRes[1]),
      total: all.length,
      vouchers: all.map((vouch) => {
        return new Voucher({
          address: parseAddress(vouch.address).toString('hex').toLocaleUpperCase(),
          epoch: Number(vouch.epoch),
        });
      }),
    });
  }

  public async getValidVouchesInSet(address: Buffer): Promise<ValidVouches> {
    const validVouchesRes = await this.olService.aptosClient.view({
      function: '0x1::proof_of_fee::get_valid_vouchers_in_set',
      type_arguments: [],
      arguments: [`0x${address.toString('hex')}`],
    });

    return new ValidVouches({
      valid: Number(validVouchesRes[1]),
      compliant: validVouchesRes[0] as boolean,
    });
  }

  public async getGivenVouches(address: Buffer): Promise<Vouch[]> {
    const givenVouchesRes = await this.olService.aptosClient.getAccountResource(
      `0x${address.toString('hex')}`,
      '0x1::vouch::GivenVouches',
    );

    const givenVouches = givenVouchesRes.data as {
      epoch_vouched: string[];
      outgoing_vouches: string[];
    };

    return givenVouches.outgoing_vouches.map((address, index) => {
      return new Vouch({
        address: parseAddress(address).toString('hex').toLocaleUpperCase(),
        epoch: Number(givenVouches.epoch_vouched[index]),
      });
    });
  }

  public async getReceivedVouches(address: Buffer): Promise<Vouch[]> {
    const receivedVouchesRes = await this.olService.aptosClient.getAccountResource(
      `0x${address.toString('hex')}`,
      '0x1::vouch::ReceivedVouches',
    );

    const receivedVouches = receivedVouchesRes.data as {
      epoch_vouched: string[];
      incoming_vouches: string[];
    };

    return receivedVouches.incoming_vouches.map((address, index) => {
      return new Vouch({
        address: parseAddress(address).toString('hex').toLocaleUpperCase(),
        epoch: Number(receivedVouches.epoch_vouched[index]),
      });
    });
  }

  public async getAncestry(address: string): Promise<string[]> {
    try {
      const ancestryRes = await this.olService.aptosClient.getAccountResource(
        `0x${address.toLocaleUpperCase()}`,
        '0x1::ancestry::Ancestry',
      );

      const ancestry = ancestryRes.data as {
        tree: string[];
      };

      return ancestry.tree;
    } catch (error) {
      return [];
    }
  }

  public async queryValidatorsVouches(): Promise<ValidatorVouches[]> {
    const eligible = await this.olService.getEligibleValidators();
    const active = await this.olService.getValidatorSet();
    const handles = this.loadValidatorHandles();
    const currentEpoch = await this.olService.aptosClient
      .getLedgerInfo()
      .then((info) => Number(info.epoch));

    const auditVals = new Map<string, boolean>();
    await Promise.all(
      eligible.map(async (address) => {
        const audit: string[] = await this.getAuditQualification(address);
        auditVals.set(address.toString('hex').toUpperCase(), audit.length === 0 ? true : false);
      }),
    );

    const validVouches = new Map<string, ValidVouches>();
    await Promise.all(
      eligible.map(async (address) => {
        validVouches.set(
          address.toString('hex').toUpperCase(),
          await this.getValidVouchesInSet(address),
        );
      }),
    );

    const getVouchDetails = async (vouch: Vouch): Promise<VouchDetails> => {
      const vouchAddress = vouch.address.toLocaleUpperCase();
      const handle = handles.get(vouchAddress) || null;
      const ancestry = await this.getAncestry(vouchAddress.toLocaleLowerCase());
      return new VouchDetails({
        address: vouchAddress,
        epoch: vouch.epoch,
        handle: handle,
        compliant: auditVals.get(vouchAddress) || false,
        epochsToExpire: vouch.epoch + 45 - currentEpoch,
        inSet: active.activeValidators.some(
          (validator) => validator.addr.toString('hex').toUpperCase() === vouchAddress,
        ),
        family: ancestry[0],
      });
    };

    const getSortedVouchesDetails = async (vouches: Vouch[]): Promise<VouchDetails[]> => {
      // Map vouches to VouchDetails objects and resolve them
      const vouchDetailsList = await Promise.all(
        vouches.map(async (vouch) => await getVouchDetails(vouch)),
      );

      // Sort the VouchDetails list based on the provided criteria
      return vouchDetailsList.sort((a, b) => {
        // 1. Sort by inSet (first those that are in the set)
        if (a.inSet !== b.inSet) return a.inSet ? -1 : 1;

        // 2. Sort by compliant (first those that are compliant)
        if (a.compliant !== b.compliant) return a.compliant ? -1 : 1;

        // 3. Sort by family
        if (a.family !== b.family) return a.family?.localeCompare(b.family || '') ? -1 : 1;

        // 4. Sort by epochsToExpire (highest number of epochs to expire first)
        if (a.epochsToExpire !== b.epochsToExpire) return b.epochsToExpire - a.epochsToExpire;

        // 5. If tied, sort alphabetically by handle
        if (a.handle && b.handle) {
          return a.handle.localeCompare(b.handle);
        }

        return 0;
      });
    };

    return await Promise.all(
      eligible.map(async (address) => {
        // get received vouches
        const received = await this.getReceivedVouches(address);
        const receivedDetails = await getSortedVouchesDetails(received);

        // get given vouches
        const given = await this.getGivenVouches(address);
        let givenDetails = await getSortedVouchesDetails(given);

        // get validator handle
        const handle = handles.get(address.toString('hex').toLocaleUpperCase()) || null;

        const addr = address.toString('hex').toLocaleUpperCase();
        return new ValidatorVouches({
          address: addr,
          handle: handle,
          inSet: active.activeValidators.some(
            (validator) => validator.addr.toString('hex').toLocaleUpperCase() === addr,
          ),
          validVouches: validVouches.get(addr)?.valid || 0,
          compliant: validVouches.get(addr)?.compliant || false,
          receivedVouches: receivedDetails,
          givenVouches: givenDetails,
        });
      }),
    );
  }

  public async getValidatorUtils(): Promise<ValidatorUtils> {
    // Get Vouch Price
    const priceRes = await this.olService.aptosClient.getAccountResource(
      '0x1',
      '0x1::vouch::VouchPrice',
    );
    const vouchPriceRes = priceRes.data as {
      amount: string;
    };

    // Get current reward
    const rewardRes = await this.olService.aptosClient.view({
      function: '0x1::proof_of_fee::get_consensus_reward',
      type_arguments: [],
      arguments: [],
    });
    const nominalReward = rewardRes[0];

    // Check Thermostat
    /*const measureRes = await this.olService.aptosClient.view({
      function: '0x1::proof_of_fee::query_reward_adjustment',
      type_arguments: [],
      arguments: [],
    });
    const didIncrement = measureRes[1] as boolean;
    const amount = measureRes[2];

    // Get current epoch
    const epochRes = await this.olService.aptosClient.getLedgerInfo();
    const currentEpoch = Number(epochRes.epoch);

    // Create ThermostatMeasure object
    const thermostatMeasure = new ThermostatMeasure({
      nextEpoch: currentEpoch + 1,
      amount: Number(nominalReward) + (didIncrement ? +1 : -1) * Number(amount),
      percentage: Math.round((Number(amount) / Number(nominalReward)) * 100),
      didIncrease: didIncrement,
    });*/

    return new ValidatorUtils({
      vouchPrice: Number(vouchPriceRes.amount) /*, thermostatMeasure */,
    });
  }

  loadValidatorHandles = (): Map<string, string> => {
    // Get the current working directory (root of the project)
    const filePath = join(process.cwd(), 'dist', 'assets', 'validator-handle.json');

    // Read and parse the JSON file
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Create a Map from the parsed data
    const validatorMap = new Map<string, string>();

    // Assuming the JSON structure is like: { "validators": { "address": "handle" } }
    Object.keys(data.validators).forEach((address) => {
      validatorMap.set(address.toUpperCase(), data.validators[address]);
    });

    return validatorMap;
  };
}
