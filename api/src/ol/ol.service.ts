import { AptosClient } from "aptos";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import BN from "bn.js";

import { OlConfig } from "../config/config.interface.js";
import {
  ConsensusReward,
  RawDonorVoiceRegistry,
  RawValidatorSet,
  ValidatorConfig,
  ValidatorGrade,
  ValidatorSet,
} from "./types.js";
import { NetworkAddresses } from "./network-addresses.js";
import { parseAddress } from "../utils.js";
import { SupplyStats } from "./types.js";

@Injectable()
export class OlService {
  public readonly aptosClient: AptosClient;

  public constructor(configService: ConfigService) {
    const config = configService.get<OlConfig>("ol")!;
    this.aptosClient = new AptosClient(config.provider);
  }

  public async getSupplyStats(): Promise<SupplyStats> {
    const supplyStats = await this.aptosClient.view({
      function: "0x1::supply::get_stats",
      type_arguments: [],
      arguments: [],
    });
    return {
      totalSupply: parseFloat(supplyStats[0] as string) / 1e6,
      slowLockedSupply: parseFloat(supplyStats[1] as string) / 1e6,
      cwSupply: parseFloat(supplyStats[2] as string) / 1e6,
      infraEscrowSupply: parseFloat(supplyStats[3] as string) / 1e6,
      circulatingSupply: parseFloat(supplyStats[4] as string) / 1e6,
    };
  }

  public async getCurrentValidators(): Promise<string[]> {
    const addresses = await this.aptosClient.view({
      function: "0x1::stake::get_current_validators",
      type_arguments: [],
      arguments: [],
    });
    return addresses[0] as string[];
  }

  public async accountExists(address: Buffer): Promise<boolean> {
    const res = await this.aptosClient.view({
      function: "0x1::account::exists_at",
      type_arguments: [],
      arguments: [`0x${address.toString("hex")}`],
    });
    return res[0] as boolean;
  }

  public async getEligibleValidators(): Promise<Buffer[]> {
    const res = await this.aptosClient.view({
      function: "0x1::validator_universe::get_eligible_validators",
      type_arguments: [],
      arguments: [],
    });
    const addresses = res[0] as string[];
    return addresses.map((address) => parseAddress(address));
  }

  public async getCurrentBid(address: Buffer) {
    const res = await this.aptosClient.view({
      function: "0x1::proof_of_fee::current_bid",
      type_arguments: [],
      arguments: [`0x${address.toString("hex")}`],
    });
    const currentBid = res as [string, string];
    return {
      currentBid: parseInt(currentBid[0], 10),
      expirationEpoch: parseInt(currentBid[1], 10),
    };
  }

  public async getValidatorGrade(address: Buffer): Promise<ValidatorGrade> {
    try {
      const res = await this.aptosClient.view({
        function: "0x1::grade::get_validator_grade",
        type_arguments: [],
        arguments: [`0x${address.toString("hex")}`],
      });
      const payload = res as [boolean, string, string];
      return {
        compliant: payload[0],
        proposedBlocks: parseInt(payload[1], 10),
        failedBlocks: parseInt(payload[2], 10),
      };
    } catch (error) {
      return {
        compliant: false,
        proposedBlocks: -1,
        failedBlocks: -1,
      };
    }
  }

  public async getAllVouchers(address: Buffer) {
    const res = await this.aptosClient.view({
      function: "0x1::vouch::all_vouchers",
      type_arguments: [],
      arguments: [`0x${address.toString("hex")}`],
    });
    return res;
  }

  public async getVouchersInValSet(address: Buffer) {
    const res = await this.aptosClient.view({
      function: "0x1::vouch::true_friends",
      type_arguments: [],
      arguments: [`0x${address.toString("hex")}`],
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
        const fullnodeAddresses = Buffer.from(
          validator.config.fullnode_addresses.substring(2),
          "hex",
        );
        const networkAddresses = Buffer.from(
          validator.config.network_addresses.substring(2),
          "hex",
        );

        return {
          addr: parseAddress(validator.addr),
          votingPower: new BN(validator.voting_power),
          config: {
            consensusPubkey: validator.config.consensus_pubkey,
            fullnodeAddresses:
              NetworkAddresses.fromBytes(fullnodeAddresses)?.toString(),
            networkAddresses:
              NetworkAddresses.fromBytes(networkAddresses)?.toString(),
            validatorIndex: new BN(validator.config.validator_index),
          },
        };
      }),
    };
  }

  public async getValidatorConfig(address: Buffer): Promise<ValidatorConfig> {
    let config;
    try {
      const res = await this.aptosClient.view({
        function: "0x1::stake::get_validator_config",
        type_arguments: [],
        arguments: [`0x${address.toString("hex")}`],
      });
      config = res as [string, string, string];
    } catch (error) {
      return {
        consensus_pubkey: "",
        fullnode_addresses: "",
        network_addresses: "",
      };
    }

    const fullnodeAddresses = config[1]
      ? NetworkAddresses.fromBytes(
          Buffer.from(config[1].substring(2), "hex"),
        )?.toString()
      : "";
    const networkAddresses = config[2]
      ? NetworkAddresses.fromBytes(
          Buffer.from(config[2].substring(2), "hex"),
        )?.toString()
      : "";
    return {
      consensus_pubkey: config[0],
      fullnode_addresses: fullnodeAddresses,
      network_addresses: networkAddresses,
    };
  }

  public async getCommunityWallets(): Promise<string[]> {
    const res = await this.aptosClient.getAccountResource(
      "0x1",
      "0x1::donor_voice::Registry",
    );
    const data = res.data as RawDonorVoiceRegistry;
    return data.list.map((it) => it.substring(2));
  }
}
