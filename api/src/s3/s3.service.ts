import fs from 'node:fs';
import Bluebird from 'bluebird';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2Command,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
  StorageClass,
} from '@aws-sdk/client-s3';
import { S3Config } from '../config/config.interface.js';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  public readonly client: S3Client;
  private readonly bucket: string;
  private readonly storageClass: string;
  // Increase timeout for large files - 20 minutes instead of 10
  private readonly uploadTimeoutMs = 20 * 60 * 1000;
  // Maximum number of upload retries
  private readonly maxRetries = 3;

  public constructor(configService: ConfigService) {
    const config = configService.get<S3Config>('s3')!;

    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true,
    });
    this.bucket = config.bucket;
    this.storageClass = config.storageClass;
  }

  public async upload(path: string, dest: string, retryCount = 0): Promise<PutObjectCommandOutput> {
    const fileSize = (await fs.promises.stat(path)).size;
    this.logger.log(`Starting upload of ${path} (${fileSize} bytes) to s3://${this.bucket}/${dest}`);
    const startTime = Date.now();

    try {
      const result = await Bluebird.race([
        Bluebird.delay(this.uploadTimeoutMs).then(() => {
          throw new Error(`upload timeout after ${this.uploadTimeoutMs / 1000} seconds`);
        }),
        this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: dest,
            Body: fs.createReadStream(path),
            StorageClass: this.storageClass as StorageClass,
          }),
        ),
      ]);

      const duration = Math.round((Date.now() - startTime) / 1000);
      this.logger.log(`Successfully uploaded ${dest} in ${duration} seconds`);
      return result;
    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000);

      // If we haven't exceeded max retries, try again with exponential backoff
      if (retryCount < this.maxRetries) {
        const backoff = Math.pow(2, retryCount) * 5000; // 5s, 10s, 20s
        this.logger.warn(
          `Upload of ${dest} failed after ${duration}s: ${error.message}. Retrying in ${backoff/1000}s (${retryCount+1}/${this.maxRetries})`,
        );

        await Bluebird.delay(backoff);
        return this.upload(path, dest, retryCount + 1);
      }

      this.logger.error(`Upload failed for ${dest} after ${duration}s and ${this.maxRetries} retries: ${error.message}`);
      throw error;
    }
  }

  public async download(key: string): Promise<GetObjectCommandOutput> {
    return await Bluebird.race([
      Bluebird.delay(10 * 60 * 1_000).then(() => {
        throw new Error('download timeout');
      }),
      this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      ),
    ]);
  }

  public async listFiles(prefix: string): Promise<string[]> {
    const files: string[] = [];

    let continuationToken: string | undefined;

    while (true) {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      if (!res.Contents) {
        break;
      }

      const prefixLength = prefix.length;
      files.push(...res.Contents.map((it) => it.Key!.substring(prefixLength)));

      if (!res.NextContinuationToken) {
        break;
      }
      continuationToken = res.NextContinuationToken;
    }
    return files;
  }
}
