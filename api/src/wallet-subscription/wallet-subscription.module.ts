import { Module, Type } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

import { redisClient } from "../redis/redis.service.js";
import { WalletSubscriptionService } from "./wallet-subscription.service.js";
import { WalletSubscriptionResolver } from "./wallet-subscription.resolver.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ClickhouseModule } from "../clickhouse/clickhouse.module.js";
import { WalletSubscriptionProcessor } from "./wallet-subscription.processor.js";
import { FirebaseModule } from "../firebase/firebase.module.js";

const roles = process.env.ROLES!.split(",");

const workers: Type<any>[] = [];
if (roles.includes("wallet-subscription-processor")) {
  workers.push(WalletSubscriptionProcessor);
}

@Module({
  imports: [
    ClickhouseModule,
    PrismaModule,
    FirebaseModule,

    BullModule.registerQueue({
      name: "wallet-subscription",
      connection: redisClient,
    }),
  ],
  providers: [
    WalletSubscriptionResolver,
    WalletSubscriptionService,
    ...workers,
  ],
  exports: [WalletSubscriptionService],
})
export class WalletSubscriptionModule {}
