import { Args, Resolver, Subscription } from "@nestjs/graphql";
import { Repeater } from "@repeaterjs/repeater";

import { NatsService } from "../../nats/nats.service.js";

@Resolver()
export class MovementsResolver {
  public constructor(private readonly natsService: NatsService) {}

  @Subscription((returns) => String)
  public async walletMovement(
    @Args({ name: "address", type: () => Buffer }) address: Buffer,
  ) {
    const walletAddress = address.toString("hex").toUpperCase();
    return new Repeater(async (push, stop) => {
      const sub = this.natsService.nc.subscribe(`wallet.${walletAddress}`, {
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
      });

      await stop;
      sub.unsubscribe();
    });
  }
}
