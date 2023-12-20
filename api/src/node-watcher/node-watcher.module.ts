import { Module } from '@nestjs/common';
import { NodeWatcherService } from './node-watcher.service.js';
import { OlModule } from '../ol/ol.module.js';

@Module({
  imports: [OlModule],
  providers: [NodeWatcherService],
  exports: [NodeWatcherService]
})
export class NodeWatcherModule {}
