import { Query, Resolver } from "@nestjs/graphql";
import { Inject } from "@nestjs/common";

import { Info } from "./models/info.model.js";
import { OlService } from "./ol.service.js";
import { Types } from "../types.js";
import { IOnChainTransactionsRepository } from "./transactions/interfaces.js";
import BN from "bn.js";

@Resolver()
export class InfoResolver {
  public constructor(
    private readonly olService: OlService,

    @Inject(Types.IOnChainTransactionsRepository)
    private readonly onChainTransactionsRepository: IOnChainTransactionsRepository,
  ) {
  }


  @Query(() => Info)
  public async info(): Promise<Info> {
    const latestStableVersion = await this.olService.getLatestStableVersion();
    let latestStableTimestamp: BN | null = null;
    if (latestStableVersion) {
      latestStableTimestamp = await this.onChainTransactionsRepository.getTransactionTimestamp(latestStableVersion);
    }

    return new Info({ latestStableVersion, latestStableTimestamp });
  }
}

