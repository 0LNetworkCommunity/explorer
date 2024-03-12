import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nats, { JetStreamClient, NatsConnection } from "nats";
import { NatsConfig } from "../config/config.interface.js";

@Injectable()
export class NatsService implements OnModuleInit, OnApplicationShutdown {
  public nc: NatsConnection;

  public jetstream: JetStreamClient;

  private servers: string;

  public constructor(config: ConfigService) {
    const natsConfig = config.get<NatsConfig>("nats")!;
    this.servers = natsConfig?.servers;
  }

  public async onModuleInit() {
    const conn = await nats.connect({
      servers: this.servers,
    });
    this.nc = conn;
    this.jetstream = conn.jetstream();
  }

  public async onApplicationShutdown(signal?: string | undefined) {
    const done = this.nc.closed();
    await this.nc.drain();
    await done;
  }
}
