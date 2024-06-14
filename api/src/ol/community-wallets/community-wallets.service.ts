import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { OlService } from "../ol.service.js";
import { GqlCommunityWallet } from "./community-wallet.model.js";
import { parseAddress } from "../../utils.js";
import { communityWallets } from "./community-wallets.js";
import { ICommunityWalletsService } from "./interfaces.js";

@Injectable()
export class CommunityWalletsService implements ICommunityWalletsService {
  public constructor(private readonly olService: OlService) {}

  public async getCommunityWallets(): Promise<GqlCommunityWallet[]> {
    const donorVoiceRegistry =
      (await this.olService.aptosClient.getAccountResource(
        "0x1",
        "0x1::donor_voice::Registry",
      )) as {
        type: "0x1::donor_voice::Registry";
        data: {
          liquidation_queue: [];
          list: string[];
        };
      };

    const addresses = donorVoiceRegistry.data.list.map((address) =>
      parseAddress(address).toString("hex").toUpperCase(),
    );

    const res = await Promise.all(
      addresses.map(async (address) => {
        const addrBuff = parseAddress(address);
        const addr = addrBuff.toString("hex").toUpperCase();
        const info = communityWallets.get(addr);
        const balance = await this.olService.getAccountBalance(addrBuff);

        return {
          address: addr,
          name: info?.name,
          description: info?.description,
          balance: balance ? balance.toNumber() : 0,
        };
      }),
    );

    // Sort by balance descending
    const sortedRes = _.sortBy(res, [(wallet) => -wallet.balance]);

    // Add rank
    return sortedRes.map(
      (wallet, index) =>
        new GqlCommunityWallet({
          rank: index + 1,
          ...wallet,
        }),
    );
  }
}
