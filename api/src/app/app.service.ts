import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  public constructor(private adapterHost: HttpAdapterHost) {}

  public async onModuleInit() {
    const server = this.adapterHost.httpAdapter.getHttpServer();
    server.on('listening', () => this.onListen());
  }

  private onListen() {
    const server = this.adapterHost.httpAdapter.getHttpServer();
    const addr = server.address();

    if (addr && typeof addr !== 'string') {
        let host: string;
        if (addr.family === 'IPv6') {
            host = `[${addr.address}]:${addr.port}`;
        } else {
            host = `${addr.address}:${addr.port}`;
        }

        const uri = `http://${host}`;
        this.logger.log(`Serving at ${uri}"`);
    }
  }
}
