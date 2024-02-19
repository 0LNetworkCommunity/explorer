import { Query, Resolver } from "@nestjs/graphql";
import _ from "lodash";
import { GqlCommunityWallet } from "./models/community-wallet.model.js";
import { communityWallets } from "./community-wallets.js";

@Resolver()
export class CommunityWalletsResolver {
  @Query(() => [GqlCommunityWallet])
  async communityWallets(): Promise<GqlCommunityWallet[]> {
    return communityWallets.map((it) => new GqlCommunityWallet(it));
  }
}
