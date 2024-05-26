import { Module } from '@nestjs/common';
import { MinioService } from './minio.service.js';

@Module({
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}
