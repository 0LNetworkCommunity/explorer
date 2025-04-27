import { Test, TestingModule } from '@nestjs/testing';
import { NodeWatcherService } from './node-watcher.service.js';
import { OlService } from '../ol/ol.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { S3Service } from '../s3/s3.service.js';
import { ClickhouseService } from '../clickhouse/clickhouse.service.js';
import { TransformerService } from '../ol/transformer.service.js';

describe('NodeWatcherService', () => {
  let service: NodeWatcherService;
  let olServiceMock: Partial<OlService>;
  let prismaServiceMock: Partial<PrismaService>;
  let s3ServiceMock: Partial<S3Service>;
  let clickhouseServiceMock: Partial<ClickhouseService>;
  let transformerServiceMock: Partial<TransformerService>;

  beforeEach(async () => {
    // Create mock implementations
    olServiceMock = {};
    prismaServiceMock = {
      node: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    s3ServiceMock = {
      upload: jest.fn().mockResolvedValue({}),
    };
    clickhouseServiceMock = {
      insertParquetFile: jest.fn().mockResolvedValue({}),
    };
    transformerServiceMock = {
      transform: jest.fn().mockResolvedValue('/tmp/transformed-files'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodeWatcherService,
        { provide: OlService, useValue: olServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: S3Service, useValue: s3ServiceMock },
        { provide: ClickhouseService, useValue: clickhouseServiceMock },
        { provide: TransformerService, useValue: transformerServiceMock },
      ],
    }).compile();

    service = module.get<NodeWatcherService>(NodeWatcherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add additional tests here for your service methods
});
