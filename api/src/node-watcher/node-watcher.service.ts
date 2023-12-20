import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OlService } from '../ol/ol.service.js';

@Injectable()
export class NodeWatcherService implements OnModuleInit {
  private readonly logger = new Logger(NodeWatcherService.name);

  public constructor(private readonly olService: OlService) {

  }

  public async onModuleInit() {
    this.logger.log('hello world!');
    this.getValidators();
  }

  private async getValidators() {
    const validatorSet = await this.olService.getValidatorSet();
    for (const validator of validatorSet.activeValidators) {
      const { fullnodeAddresses, networkAddresses } = validator.config;
      if (fullnodeAddresses) {
        console.log(fullnodeAddresses);
      }

      if (networkAddresses) {
        console.log(networkAddresses);
      }
    }
  }
}
