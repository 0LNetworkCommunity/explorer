import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import _ from 'lodash';
import { OnModuleInit, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

import { NodeWatcherService } from './node-watcher.service.js';

@Processor('node-watcher', {
  lockDuration: 30000, // 30 seconds lock
  stalledInterval: 15000, // Check for stalled jobs every 15 seconds
  maxStalledCount: 3, // Consider job stalled after 3 missed checks
})
export class NodeWatcherProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(NodeWatcherProcessor.name);

  public constructor(
    @InjectQueue('node-watcher')
    private readonly nodeWatcherQueue: Queue,
    private readonly nodeWatcherService: NodeWatcherService,
  ) {
    super();
  }

  public async onModuleInit() {
    this.logger.log('Initializing NodeWatcherProcessor');

    try {
      // Clean existing jobs
      await this.cleanupExistingJobs();

      // Add jobs with stable IDs
      await this.addProcessingJobs();

      this.logger.log('NodeWatcherProcessor initialized successfully');
    } catch (error) {
      this.logger.error(`Error initializing node-watcher jobs: ${error.message}`);
    }
  }

  private async cleanupExistingJobs() {
    try {
      // Get all job counts
      const counts = await this.nodeWatcherQueue.getJobCounts();
      this.logger.debug(`Current job counts: ${JSON.stringify(counts)}`);

      // Clean all job types including stalled jobs
      this.logger.log('Cleaning up active, waiting, delayed, and stalled jobs');

      // Use obliterate to completely clean the queue if there are issues
      // Aggressive but helps resolve lock renewal problems
      if (counts.active > 0 || counts.stalled > 0) {
        this.logger.warn(`Found active or stalled jobs, using obliterate to clean queue`);
        await this.nodeWatcherQueue.obliterate({ force: true });
      } else {
        // Otherwise just clean all job states
        await this.nodeWatcherQueue.clean(0, 1000, 'active');
        await this.nodeWatcherQueue.clean(0, 1000, 'wait');
        await this.nodeWatcherQueue.clean(0, 1000, 'delayed');
        await this.nodeWatcherQueue.clean(0, 1000, 'completed');
        await this.nodeWatcherQueue.clean(0, 1000, 'failed');
      }

      this.logger.log('Cleaned up existing jobs');
    } catch (error) {
      this.logger.error(`Error cleaning up jobs: ${error.message}`);
    }
  }

  /**
   * Clean up old jobs to prevent Redis memory issues
   * This performs a more targeted cleanup than cleanupExistingJobs
   * by only removing older completed and failed jobs
   */
  private async cleanupQueues() {
    try {
      this.logger.log('Starting queue cleanup to reduce Redis memory usage');

      // Get current job counts to log before cleanup
      const countsBefore = await this.nodeWatcherQueue.getJobCounts();
      this.logger.debug(`Job counts before cleanup: ${JSON.stringify(countsBefore)}`);

      // Keep jobs from the last hour for debugging (3600000 ms = 1 hour)
      const completedCleanupCount = await this.nodeWatcherQueue.clean(3600000, 100, 'completed');
      this.logger.log(`Cleaned up ${completedCleanupCount} completed jobs older than 1 hour`);

      // Keep failed jobs from the last day for debugging (86400000 ms = 24 hours)
      const failedCleanupCount = await this.nodeWatcherQueue.clean(86400000, 100, 'failed');
      this.logger.log(`Cleaned up ${failedCleanupCount} failed jobs older than 24 hours`);

      // Get counts after cleanup to confirm results
      const countsAfter = await this.nodeWatcherQueue.getJobCounts();
      this.logger.log(`Job counts after cleanup: ${JSON.stringify(countsAfter)}`);

      // Check for any stalled jobs and handle them
      if (countsAfter.stalled > 0) {
        this.logger.warn(`Found ${countsAfter.stalled} stalled jobs, will attempt to recover them`);

        // Handle stalled jobs differently based on the count
        if (countsAfter.stalled > 10) {
          // For many stalled jobs, use a complete obliterate (which will reset everything)
          this.logger.warn(`Large number of stalled jobs (${countsAfter.stalled}), performing complete queue reset`);
          await this.nodeWatcherQueue.obliterate({ force: true });

          // Re-add the processing jobs after obliteration
          this.logger.log('Re-adding scheduled jobs after queue reset');
          await this.addProcessingJobs();
        } else {
          // For a smaller number of stalled jobs, use a more targeted approach
          this.logger.log(`Found ${countsAfter.stalled} stalled jobs, attempting to recover`);

          // Try to recover stalled jobs by removing and re-adding them
          const activeJobs = await this.nodeWatcherQueue.getJobs(['active']);
          const potentiallyStalledJobs = activeJobs.filter(job => {
            const processingTime = Date.now() - (job.processedOn || 0);
            // If a job has been processing for over 3 minutes, consider it stalled
            return processingTime > 3 * 60 * 1000;
          });

          if (potentiallyStalledJobs.length > 0) {
            this.logger.log(`Removing ${potentiallyStalledJobs.length} potentially stalled jobs and re-adding them`);

            for (const job of potentiallyStalledJobs) {
              try {
                // Get the job data and options
                const jobData = job.data;
                const jobName = job.name;

                // Remove the stalled job
                await job.remove();

                // Re-add the job with the same data but new ID
                await this.nodeWatcherQueue.add(jobName, jobData, {
                  jobId: `${jobName}-recovery-${Date.now()}`,
                  removeOnComplete: { count: 10 },
                  removeOnFail: { count: 10 },
                });

                this.logger.debug(`Successfully re-added job ${jobName}`);
              } catch (error) {
                this.logger.warn(`Failed to recover job ${job.id}: ${error.message}`);
              }
            }
          }
        }
      }

      this.logger.log('Queue cleanup completed successfully');
    } catch (error) {
      this.logger.error(`Error during queue cleanup: ${error.message}`);
    }
  }

  private async addProcessingJobs() {
    try {
      // Add updateValidators job with specific repeat key to ensure proper tracking
      const updateValidatorsKey = 'validators-update-job';
      await this.nodeWatcherQueue.add(
        'updateValidators',
        { timestamp: Date.now() },
        {
          jobId: `updateValidators-${Date.now()}`,
          removeOnComplete: { count: 10 }, // Keep only 10 most recent completed jobs
          removeOnFail: { count: 10 },     // Keep only 10 most recent failed jobs
          repeat: {
            key: updateValidatorsKey,
            every: 15 * 60 * 1_000, // 15 minutes (reduced frequency)
            limit: 100, // Reduced from 1000 to limit queue size
          },
        }
      );
      this.logger.log(`Added updateValidators job with repeat key: ${updateValidatorsKey}`);

      // Add checkNodes job with specific repeat key to ensure proper tracking
      const checkNodesKey = 'nodes-check-job';
      await this.nodeWatcherQueue.add(
        'checkNodes',
        { timestamp: Date.now() },
        {
          jobId: `checkNodes-${Date.now()}`,
          removeOnComplete: { count: 10 }, // Keep only 10 most recent completed jobs
          removeOnFail: { count: 10 },     // Keep only 10 most recent failed jobs
          repeat: {
            key: checkNodesKey,
            every: 2 * 60 * 1_000, // 2 minutes
            limit: 100,
          },
        }
      );
      this.logger.log(`Added checkNodes job with repeat key: ${checkNodesKey}`);

      // Add a cleanup job that runs regularly to prevent Redis memory issues
      const cleanupQueuesKey = 'queue-cleanup-job';
      await this.nodeWatcherQueue.add(
        'cleanupQueues',
        { timestamp: Date.now() },
        {
          jobId: `cleanupQueues-${Date.now()}`,
          removeOnComplete: { count: 5 }, // Only keep the 5 most recent cleanup jobs
          removeOnFail: { count: 5 },
          repeat: {
            key: cleanupQueuesKey,
            every: 1 * 60 * 60 * 1_000, // Run every 1 hours
            limit: 100,
          },
        }
      );
      this.logger.log(`Added queue cleanup job with repeat key: ${cleanupQueuesKey}`);
    } catch (error) {
      this.logger.error(`Error adding processing jobs: ${error.message}`);
      throw error;
    }
  }

  private async checkNodes() {
    this.logger.log('Starting checkNodes job');
    try {
      await this.nodeWatcherService.checkNodes();
      this.logger.log('checkNodes job completed successfully');
    } catch (error) {
      this.logger.error(`Error in checkNodes job: ${error.message}`);
      // Don't rethrow error to prevent BullMQ job failure
    }
  }

  private async updateValidators() {
    this.logger.log('Starting updateValidators job');
    try {
      await this.nodeWatcherService.updateValidatorsList();
      this.logger.log('updateValidatorsList completed');

      await this.nodeWatcherService.updateValidatorLocations();
      this.logger.log('updateValidatorLocations completed');
    } catch (error) {
      this.logger.error(`Error in updateValidators job: ${error.message}`);
      // Don't rethrow error to prevent BullMQ job failure
    }
  }

  public async process(job: Job<any, any, string>) {
    this.logger.log(`Processing job: ${job.name} (ID: ${job.id})`);

    try {
      // Ensure job has a proper ID before processing
      if (!job.id) {
        this.logger.warn(`Job ${job.name} has no ID, skipping processing`);
        return;
      }

      // Handle repeat key errors by checking if the job has a repeat key
      if (job.opts.repeat && job.opts.repeat.key) {
        const repeatKey = job.opts.repeat.key;
        this.logger.log(`Processing repeat job with key: ${repeatKey}`);
      }

      switch (job.name) {
        case 'updateValidators':
          await this.updateValidators();
          break;
        case 'checkNodes':
          await this.checkNodes();
          break;
        case 'cleanupQueues':
          await this.cleanupQueues();
          break;
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return; // Return instead of throwing to prevent job failure
      }

      this.logger.log(`Job ${job.name} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing job ${job.name}: ${error.message}`);
      // Don't rethrow to prevent BullMQ job failure issues
    }
  }
}
