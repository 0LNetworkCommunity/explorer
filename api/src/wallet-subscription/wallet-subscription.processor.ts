import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WalletSubscriptionService } from './wallet-subscription.service.js';

export interface ReleaseVersionJobData {
  version: string;
}

@Processor('wallet-subscription')
export class WalletSubscriptionProcessor extends WorkerHost {
  public constructor(private readonly walletSubscriptionService: WalletSubscriptionService) {
    super();
  }

  public async process(job: Job<ReleaseVersionJobData, any, string>): Promise<any> {
    switch (job.name) {
      case 'releaseVersion':
        await this.walletSubscriptionService.processReleaseVersionJob(job.data.version);
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }
}
