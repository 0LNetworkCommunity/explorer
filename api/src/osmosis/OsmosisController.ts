import { Controller, Post } from "@nestjs/common";
import { OsmosisHistoricalProcessor } from "./OsmosisHistoricalProcessor.js";
import { OsmosisLiveProcessor } from "./OsmosisLiveProcessor.js";

@Controller("osmosis")
export class OsmosisController {
  constructor(
    private readonly osmosisHistoricalProcessor: OsmosisHistoricalProcessor,
    private readonly osmosisLiveProcessor: OsmosisLiveProcessor,
  ) {}

  @Post("fetch-historical")
  async triggerHistoricalFetch(): Promise<string> {
    await this.osmosisHistoricalProcessor.triggerFetchHistoricalData();
    return "Osmosis Historical data fetching triggered";
  }

  @Post("fetch-live")
  async triggerLiveFetch(): Promise<string> {
    await this.osmosisLiveProcessor.triggerFetchLiveData();
    return "Osmosis Live data fetching triggered";
  }
}
