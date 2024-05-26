import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';
import { MinioConfig } from '../config/config.interface.js';
import Bluebird from 'bluebird';

@Injectable()
export class MinioService {
  private readonly minioClient: Minio.Client;
  private readonly bucket: string;

  public constructor(configService: ConfigService) {
    const config = configService.get<MinioConfig>("minio")!;

    this.minioClient = new Minio.Client({
      endPoint: config.endpoint,
      port: config.port,
      useSSL: false,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
    this.bucket = config.bucket;
  }

  public upload(objectName: string, buffer: Buffer, size: number, metaData: Minio.ItemBucketMetadata) {
    return Bluebird.any([
      Bluebird.delay(10 * 60 * 1_000).then(() => {
        throw new Error("upload timeout");
      }),
      this.minioClient.putObject(
        this.bucket,
        objectName,
        buffer,
        size,
        metaData
      )
    ]);
  }

  /** Direct File Download as Object */
  public async directDownload(key: string, downloadPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.minioClient.fGetObject(this.bucket, key, downloadPath);
    });
  }

  public async download(key: string) : Promise<any> {
    return Bluebird.any([
      Bluebird.delay(10 * 60 * 1_000).then(() => {
        throw new Error('download timeout');
      }),
      this.minioClient.getObject(
        this.bucket,
        key,
      )
    ]);
  }

  public async listFiles(prefix: string): Promise<string[]> {
    const files: string[] = [];

    try{
      const stream= this.minioClient.listObjects(
        this.bucket,
        prefix,
        true,
      );

      for await (const obj of stream) {
        files.push(obj.name);
      }
    } catch (error) {
      console.error(error);
    }

    return files;
  }
}
