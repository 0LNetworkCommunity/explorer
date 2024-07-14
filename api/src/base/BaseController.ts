import { Controller, Post } from "@nestjs/common";
import { BaseHistoricalProcessor } from "./BaseHistoricalProcessor.js";
import { BaseLiveProcessor } from "./BaseLiveProcessor.js";

@Controller("base")
export class BaseController {
  constructor(
    private readonly baseHistoricalProcessor: BaseHistoricalProcessor,
    private readonly baseLiveProcessor: BaseLiveProcessor,
  ) {}

  @Post("fetch-historical")
  async triggerHistoricalFetch(): Promise<string> {
    await this.baseHistoricalProcessor.triggerFetchHistoricalData();
    return "Base Historical data fetching triggered";
  }

  @Post("fetch-live")
  async triggerLiveFetch(): Promise<string> {
    await this.baseLiveProcessor.triggerFetchLiveData();
    return "Base Live data fetching triggered";
  }
}
