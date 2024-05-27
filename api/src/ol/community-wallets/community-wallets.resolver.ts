import { Query, Resolver } from "@nestjs/graphql";
import _ from "lodash";
import { Inject } from "@nestjs/common";

import { GqlCommunityWallet } from "./community-wallet.model.js";
import { ICommunityWalletsService } from "./interfaces.js";
import { Types } from "../../types.js";

@Resolver()
export class CommunityWalletsResolver {
  public constructor(
    @Inject(Types.ICommunityWalletsService)
    private readonly communityWalletsService: ICommunityWalletsService,
  ) {}

  @Query(() => [GqlCommunityWallet])
  async communityWallets(): Promise<GqlCommunityWallet[]> {
    return this.communityWalletsService.getCommunityWallets();
  }
}
