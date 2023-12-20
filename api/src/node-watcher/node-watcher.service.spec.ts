import { Test, TestingModule } from '@nestjs/testing';
import { NodeWatcherService } from './node-watcher.service';

describe('NodeWatcherService', () => {
  let service: NodeWatcherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NodeWatcherService],
    }).compile();

    service = module.get<NodeWatcherService>(NodeWatcherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
