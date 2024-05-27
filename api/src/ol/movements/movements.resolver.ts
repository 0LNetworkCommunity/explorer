import { Args, Resolver, Subscription } from "@nestjs/graphql";
import { Repeater } from "@repeaterjs/repeater";

import { NatsService } from "../../nats/nats.service.js";

@Resolver()
export class MovementsResolver {
  public constructor(private readonly natsService: NatsService) {}

  @Subscription((returns) => String)
  public async walletMovement(
    @Args({ name: "address", type: () => Buffer })
    address: Buffer,
  ) {
    const walletAddress = address.toString("hex").toUpperCase();

    let address32: Uint8Array;
    if (address.length === 16) {
      address32 = new Uint8Array(Buffer.concat([Buffer.alloc(16), address]));
    } else if (address.length === 32) {
      address32 = address;
    } else {
      throw new Error(`invalid address length ${address.length}`);
    }

    return new Repeater(async (push, stop) => {
      const sub = this.natsService.nc.subscribe(
        `wallet.${Buffer.from(address32).toString("hex").toUpperCase()}`,
        {
          callback(err, msg) {
            if (err) {
              stop(err);
            } else {
              const { version } = msg.json<{ version: string }>();
              push({
                walletMovement: version,
              });
            }
          },
        },
      );

      await stop;
      sub.unsubscribe();
    });
  }
}
