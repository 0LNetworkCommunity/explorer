import fs from "node:fs";
import Bluebird from "bluebird";
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsCommand,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
  StorageClass,
} from "@aws-sdk/client-s3";
import { S3Config } from '../config/config.interface.js';

@Injectable()
export class S3Service {
  public readonly client: S3Client;

  private readonly bucket: string;

  private readonly storageClass: string;

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

  public upload(path: string, dest: string): Promise<PutObjectCommandOutput> {
    return Bluebird.any([
      Bluebird.delay(10 * 60 * 1_000).then(() => {
        throw new Error('upload timeout');
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
  }

  public download(key: string): Promise<GetObjectCommandOutput> {
    return Bluebird.any([
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

    let marker: string | undefined;

    while (true) {
      const res = await this.client.send(
        new ListObjectsCommand({
          Bucket: this.bucket,
          Prefix: prefix,
          Marker: marker,
        }),
      );

      if (!res.Contents) {
        break;
      }

      const prefixLength = prefix.length;
      files.push(...res.Contents.map((it) => it.Key!.substring(prefixLength)));

      if (!res.NextMarker) {
        break;
      }
      marker = res.NextMarker;
    }
    return files;
  }
}
