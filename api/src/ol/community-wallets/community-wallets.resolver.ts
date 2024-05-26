import { Query, Resolver } from "@nestjs/graphql";
import _ from "lodash";
import { GqlCommunityWallet } from "../models/community-wallet.model.js";
import { communityWallets } from "./community-wallets.js";
import { OlService } from "../ol.service.js";
import { parseAddress } from "../../utils.js";

@Resolver()
export class CommunityWalletsResolver {
  public constructor(private readonly olService: OlService) {}

  @Query(() => [GqlCommunityWallet])
  async communityWallets(): Promise<GqlCommunityWallet[]> {
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

    const res = addresses.map((address) => {
      const addrBuff = parseAddress(address);
      const addr = addrBuff.toString("hex").toUpperCase();
      const info = communityWallets.get(addr);

      return new GqlCommunityWallet({
        address: addrBuff,
        name: info?.name,
        description: info?.description,
      });
    });

    const groups = _.groupBy(res, (wallet) => {
      if (wallet.name && wallet.description) {
        return "nameAndDescription";
      }
      if (wallet.name) {
        return "nameOnly";
      }
      if (wallet.description) {
        return "descriptionOnly";
      }
      return "rest";
    });

    const { nameAndDescription, nameOnly, descriptionOnly, rest } = groups;
    const sorter = (wallet: GqlCommunityWallet) =>
      wallet.address.toString("hex");

    return [
      ..._.sortBy(nameAndDescription, sorter),
      ..._.sortBy(nameOnly, sorter),
      ..._.sortBy(descriptionOnly, sorter),
      ..._.sortBy(rest, sorter),
    ];
  }
}
