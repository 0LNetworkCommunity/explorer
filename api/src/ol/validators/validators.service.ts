import { Injectable, Logger } from '@nestjs/common';
import Bluebird from 'bluebird';
import axios from 'axios';
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
  //ThermostatMeasure,
  VfnStatus,
  VfnStatusType,
} from '../models/validator.model.js';
import { parseAddress } from '../../utils.js';
import { redisClient } from '../../redis/redis.service.js';
import {
  VALIDATORS_CACHE_KEY,
  VALIDATORS_VFN_STATUS_CACHE_KEY,
  VALIDATORS_VOUCHES_CACHE_KEY,
  VALIDATORS_HANDLERS_CACHE_KEY,
} from '../constants.js';

import * as net from 'net';
import { OlConfig } from '../../config/config.interface.js';

// Regex to match the fullnode address pattern
const fullnodeRegex =
  /^\/(ip4|dns)\/([\d\.]+|[\w\.-]+)\/tcp\/\d+\/noise-ik\/0x[a-fA-F0-9]+\/handshake\/\d+$/;

@Injectable()
export class ValidatorsService {
  private readonly cacheEnabled: boolean;
  private readonly validatorHandlesUrl: string | undefined;
  private readonly logger = new Logger(ValidatorsService.name);
  public constructor(
    private readonly olService: OlService,
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.cacheEnabled = config.get<boolean>('cacheEnabled')!;
    this.validatorHandlesUrl = config.get<OlConfig>('ol')?.validatorHandlesUrl;
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

  public async getValidatorsHandlers(): Promise<Map<string, string>> {
    if (this.cacheEnabled) {
      this.logger.debug('Cache is enabled')
      const cacheHandlersString = await this.getFromCache<string>(VALIDATORS_HANDLERS_CACHE_KEY);
      // NOTE: cacheHandlersString is NOT a string (it is an Object)
      let result:Map<string, string> = new Map([['bad', 'data']]);
      if (cacheHandlersString) {
        let entries = Object.entries(cacheHandlersString);
        result = new Map<string, string>(entries)
      } else {
        result = new Map();
      }
      this.logger.debug(`returning handles map with ${result.size} entries`)
      return result;
    }

    let handlers = new Map<string, string>();
    try {
      handlers = await this.loadValidatorHandles();
      this.logger.debug(`Loaded validator handles: ${handlers}, ${JSON.stringify(handlers)}`)
    } catch (error) {
      this.logger.error('Error loading validators handlers', error);
    } finally {
      const obj = Object.fromEntries(handlers);
      this.logger.debug(`Storing validator handles: ${obj}, ${JSON.stringify(obj)}`)
      await redisClient.set(VALIDATORS_HANDLERS_CACHE_KEY, JSON.stringify(obj));
      this.logger.log('Validators handlers cache updated');
    }

    return handlers;
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
        const vfnStatus = await this.getVfnStatus(validator.addr.toString('hex').toUpperCase());

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
          vfnStatus,
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
          vfnStatus: null,
          grade: null,
          city: null,
          country: null,
        };
      }),
    );

    let handles = await this.getValidatorsHandlers();
    this.logger.debug(`handles map has ${handles.size} entries`)
    let allValidators = [...currentValidators, ...eligibleValidators];
    return await Promise.all(
      allValidators.map(async (validator) => {
        const vouches = await this.getVouches(validator.address);
        const balance = await this.olService.getAccountBalance(validator.address);
        const currentBid = await this.olService.getCurrentBid(validator.address);
        const slowWallet = await this.olService.getSlowWallet(validator.address);
        const unlocked = Number(slowWallet?.unlocked);
        const addr = validator.address.toString('hex').toLocaleUpperCase();
        const handle = handles.get(addr) || null;
        this.logger.debug(`Setting handle as: ${handle}`)

        return new Validator({
          inSet: validator.inSet,
          index: validator.index,
          address: addr,
          handle: handle,
          votingPower: validator.votingPower,
          vfnStatus: validator.vfnStatus,
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
    const handles = await this.getValidatorsHandlers();
    this.logger.debug(`handles map has ${handles.size} entries`)
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

    const families = new Map<string, string>();
    await Promise.all(
      eligible.map(async (address) => {
        const ancestry = await this.getAncestry(address.toString('hex').toLocaleUpperCase());
        families.set(address.toString('hex').toLocaleUpperCase(), ancestry[0]);
      }),
    );

    const getVouchDetails = (vouch: Vouch): VouchDetails => {
      const vouchAddress = vouch.address.toLocaleUpperCase();
      const handle = handles.get(vouchAddress) || null;
      const family = families.get(vouchAddress) || null;
      return new VouchDetails({
        address: vouchAddress,
        epoch: vouch.epoch,
        handle: handle,
        compliant: auditVals.get(vouchAddress) || false,
        epochsToExpire: vouch.epoch + 45 - currentEpoch,
        inSet: active.activeValidators.some(
          (validator) => validator.addr.toString('hex').toUpperCase() === vouchAddress,
        ),
        family: family,
      });
    };

    const getSortedVouchesDetails = async (vouches: Vouch[]): Promise<VouchDetails[]> => {
      // Map vouches to VouchDetails objects
      const vouchDetailsList = vouches.map((vouch) => getVouchDetails(vouch));

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

        const addr = address.toString('hex').toLocaleUpperCase();

        // get validator handle
        const handle = handles.get(addr) || null;

        // get validator family
        const family = families.get(addr) || null;

        return new ValidatorVouches({
          address: addr,
          family: family,
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
    const nominalReward = Number(rewardRes[0]);
    const entryFee = Number(rewardRes[1]);
    const clearingBid = Number(rewardRes[2]);

    return new ValidatorUtils({
      vouchPrice: Number(vouchPriceRes.amount),
      entryFee: entryFee,
      clearingBid: clearingBid,
      netReward: nominalReward - entryFee,
    });
  }

  async loadValidatorHandles(): Promise<Map<string, string>> {
    if (!this.validatorHandlesUrl) {
      return new Map<string, string>();
    }

    const response = await axios.get(this.validatorHandlesUrl);
    const data = response.data;

    const validatorMap = new Map<string, string>();
    Object.keys(data.validators).forEach((address) => {
      let addressStr = address.replace(/^0x/, '').toUpperCase();
      validatorMap.set(addressStr, data.validators[address]);
    });

    return validatorMap;
  }

  public async queryValidatorsVfnStatus(): Promise<VfnStatus[]> {
    let ret: VfnStatus[] = [];
    const active = await this.olService.getValidatorSet();
    for (const validator of active.activeValidators) {
      let fullnode = validator.config.fullnodeAddresses;
      if (fullnode) {
        const vfnStatus = await this.queryVfnStatus(fullnode);
        ret.push(
          new VfnStatus({
            address: validator.addr.toString('hex').toUpperCase(),
            status: vfnStatus,
          }),
        );
      }
    }

    return ret;
  }

  async getVfnStatus(address: string): Promise<VfnStatusType | null> {
    const cacheData = await this.getFromCache<VfnStatus[]>(VALIDATORS_VFN_STATUS_CACHE_KEY);
    if (cacheData) {
      const vfnStatus = cacheData.find((item) => item.address === address);
      return vfnStatus ? (vfnStatus.status as VfnStatusType) : null;
    }

    return null;
  }

  async queryVfnStatus(fullnodeAddress: String): Promise<VfnStatusType> {
    // Variable to store the status
    let status: VfnStatusType;

    // Check the VFN address
    const match = fullnodeAddress && fullnodeAddress.match(fullnodeRegex);

    if (match) {
      // Extract the IP or DNS
      const valIp = match[2];

      // Check if the address is accessible
      status = await this.checkAddressAccessibility(valIp, 6182)
        .then((res) => {
          return res ? VfnStatusType.Accessible : VfnStatusType.NotAccessible;
        })
        .catch(() => {
          return VfnStatusType.NotAccessible;
        });
    } else {
      status = VfnStatusType.InvalidAddress;
    }

    return status;
  }

  async checkAddressAccessibility(ip: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();

      // Timeout in case the server is not accessible
      socket.setTimeout(1000);

      // Try to connect to the IP and port
      socket.connect(port, ip, () => {
        socket.end();
        resolve(true);
      });

      socket.on('error', () => {
        this.logger.warn(`Error connecting to ${ip}:${port}`);
        resolve(false);
      });

      socket.on('timeout', () => {
        this.logger.warn(`Timeout connecting to ${ip}:${port}`);
        resolve(false);
      });
    });
  }
}
