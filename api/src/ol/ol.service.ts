import { AptosClient } from "aptos";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { OlConfig } from "../config/config.interface.js";

@Injectable()
export class OlService {
  public readonly aptosClient: AptosClient;

  public constructor(configService: ConfigService) {
    const config = configService.get<OlConfig>("ol")!;
    this.aptosClient = new AptosClient(config.provider);
  }
}
