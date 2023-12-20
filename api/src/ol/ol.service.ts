import { AptosClient } from "aptos";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { OlConfig } from "../config/config.interface.js";
import { ConsensusReward, RawValidatorSet, ValidatorGrade, ValidatorSet } from "./types.js";
import { NetworkAddresses } from "./network-addresses.js";

@Injectable()
export class OlService {
  public readonly aptosClient: AptosClient;

  public constructor(configService: ConfigService) {
    const config = configService.get<OlConfig>("ol")!;
    this.aptosClient = new AptosClient(config.provider);
  }

  public async getCurrentValidators(): Promise<string[]> {
    const addresses = await this.aptosClient.view({
      function: "0x1::stake::get_current_validators",
      type_arguments: [],
      arguments: [],
    });
    return addresses[0] as string[];
  }

  public async getEligibleValidators(): Promise<string[]> {
    const addresses = await this.aptosClient.view({
      function: "0x1::validator_universe::get_eligible_validators",
      type_arguments: [],
      arguments: [],
    });
    return addresses[0] as string[];
  }

  public async getCurrentBid(address: string) {
    const res = await this.aptosClient.view({
      function: "0x1::proof_of_fee::current_bid",
      type_arguments: [],
      arguments: [address],
    });
    const currentBid = res as [string, string];
    return {
      currentBid: parseInt(currentBid[0], 10),
      expirationEpoch: parseInt(currentBid[1], 10),
    };
  }

  public async getValidatorGrade(address: string): Promise<ValidatorGrade> {
    try {
      const res = await this.aptosClient.view({
        function: "0x1::grade::get_validator_grade",
        type_arguments: [],
        arguments: [address],
      });
      const payload = res as [boolean, string, string, { value: string }];
      return {
        compliant: payload[0],
        proposedBlocks: parseInt(payload[1], 10),
        failedBlocks: parseInt(payload[2], 10),
        ratio: parseInt(payload[3].value, 10),
      };
    } catch (error) {
      console.log(error);
      return {
        compliant: false,
        proposedBlocks: -1,
        failedBlocks: -1,
        ratio: -1,
      };
    }
  }

  public async getAllVouchers(address: string) {
    const res = await this.aptosClient.view({
      function: "0x1::vouch::all_vouchers",
      type_arguments: [],
      arguments: [address],
    });
    return res;
  }

  public async getVouchersInValSet(address: string) {
    const res = await this.aptosClient.view({
      function: "0x1::vouch::true_friends",
      type_arguments: [],
      arguments: [address],
    });
    return res;
  }

  public async getConsensusReward(): Promise<ConsensusReward> {
    const res = await this.aptosClient.getAccountResource(
      "0x1",
      "0x1::proof_of_fee::ConsensusReward",
    );
    const consensusRewardRes = res.data as {
      clearing_bid: string;
      entry_fee: string;
      median_history: [string, string];
      median_win_bid: string;
      net_reward: string;
      nominal_reward: string;
    };

    return {
      clearingBid: parseInt(consensusRewardRes.clearing_bid, 10),
      entryFee: parseInt(consensusRewardRes.entry_fee, 10),
      medianHistory: [
        parseInt(consensusRewardRes.median_history[0], 10),
        parseInt(consensusRewardRes.median_history[1], 10),
      ],
      medianWinBid: parseInt(consensusRewardRes.median_win_bid),
      netReward: parseInt(consensusRewardRes.net_reward, 10),
      nominalReward: parseInt(consensusRewardRes.nominal_reward, 10),
    };
  }

  public async getValidatorSet(): Promise<ValidatorSet> {
    const res = await this.aptosClient.getAccountResource(
      "0x1",
      "0x1::stake::ValidatorSet",
    );
    const data = res.data as RawValidatorSet;

    return {
      activeValidators: data.active_validators.map((validator) => {
        const fullnodeAddresses = Buffer.from(validator.config.fullnode_addresses.substring(2), 'hex');
        const networkAddresses = Buffer.from(validator.config.network_addresses.substring(2), 'hex');

        return {
          addr: validator.addr,
          votingPower: parseInt(validator.voting_power, 10),
          config: {
            consensusPubkey: validator.config.consensus_pubkey,
            fullnodeAddresses: NetworkAddresses.fromBytes(fullnodeAddresses)?.toString(),
            networkAddresses: NetworkAddresses.fromBytes(networkAddresses)?.toString(),
            validatorIndex: parseInt(validator.config.validator_index, 10),
          },
        };
      }),
    };
  }
}
