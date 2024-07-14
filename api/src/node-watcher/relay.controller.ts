import { Controller, Get } from '@nestjs/common';
import { NodeWatcherService } from './node-watcher.service.js';

@Controller('relay')
class RelayController {
  public constructor(private readonly nodeWatcherService: NodeWatcherService) {}

  @Get('/upstreams')
  public async getUpstreams() {
    const ips = await this.nodeWatcherService.getUpstreams();
    return ['upstream rpc_ol {', ips.map((ip) => `  server ${ip}:8080;`).join('\n'), '}\n'].join(
      '\n',
    );
  }
}

export default RelayController;
