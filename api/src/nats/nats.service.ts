import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nats, { NatsConnection } from "nats";
import { NatsConfig } from "../config/config.interface.js";

@Injectable()
export class NatsService implements OnModuleInit, OnApplicationShutdown {
  public nc: NatsConnection;

  private servers: string;

  public constructor(config: ConfigService) {
    const natsConfig = config.get<NatsConfig>('nats')!;
    this.servers = natsConfig?.servers;
  }

  public async onModuleInit() {
    this.nc = await nats.connect({
      servers: this.servers,
    });
  }

  public async onApplicationShutdown(signal?: string | undefined) {
    const done = this.nc.closed();
    await this.nc.drain();
    await done;
  }
}
