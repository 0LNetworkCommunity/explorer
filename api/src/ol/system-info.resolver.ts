import { Query, Resolver } from "@nestjs/graphql";
import _ from "lodash";
import { OlService } from "./ol.service.js";
import { GqlSystemInfo } from "./models/system-info.model.js";

@Resolver()
export class SystemInfoResolver {
  public constructor(private readonly olService: OlService) {}

  @Query(() => GqlSystemInfo)
  async systemInfo(): Promise<GqlSystemInfo> {
    const [consensusReward] = await Promise.all([
      this.olService.getConsensusReward()
    ]);

    console.log(consensusReward);

    return new GqlSystemInfo({
      consensusReward: 0,
    });
  }
}
