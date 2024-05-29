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

  public getWalletTransactionChannel(address: Uint8Array): string {
    let address32: Uint8Array;
    if (address.length === 16) {
      address32 = new Uint8Array(Buffer.concat([Buffer.alloc(16), address]));
    } else if (address.length === 32) {
      address32 = address;
    } else {
      throw new Error(`invalid address length ${address.length}`);
    }

    return `wallet.${Buffer.from(address32).toString("hex").toUpperCase()}.transaction`;
  }

  public getWalletMovementChannel(address: Uint8Array): string {
    let address32: Uint8Array;
    if (address.length === 16) {
      address32 = new Uint8Array(Buffer.concat([Buffer.alloc(16), address]));
    } else if (address.length === 32) {
      address32 = address;
    } else {
      throw new Error(`invalid address length ${address.length}`);
    }

    return `wallet.${Buffer.from(address32).toString("hex").toUpperCase()}.movement`;
  }
}
