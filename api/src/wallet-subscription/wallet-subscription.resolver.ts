import { Args, Mutation, Resolver, registerEnumType } from "@nestjs/graphql";
import { WalletSubscriptionService } from "./wallet-subscription.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { GraphQLError } from "graphql";

export enum DeviceType {
  IOS = "IOS",
  ANDROID = "ANDROID",
}

registerEnumType(DeviceType, { name: "DeviceType" });

@Resolver()
export class WalletSubscriptionResolver {
  public constructor(
    private readonly walletSubscriptionService: WalletSubscriptionService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation(() => Boolean)
  async walletSubscribe(
    @Args("walletAddress")
    walletAddress: Buffer,

    @Args("deviceToken")
    deviceToken: string,

    @Args({
      name: "deviceType",
      type: () => DeviceType,
    })
    deviceType: DeviceType,
  ): Promise<boolean> {
    if (walletAddress.length !== 16 && walletAddress.length !== 32) {
      throw new GraphQLError("Invalid walletAddress length. Must be 16 or 32.");
    }

    const res = await this.prisma.$queryRaw<[{ id: string }]>`
      WITH e AS(
        INSERT INTO "Device" ("type", "token")
        VALUES (
          CAST(${deviceType} as "DeviceType"),
          ${deviceToken}
        )
        ON CONFLICT ("type", "token") DO NOTHING
        RETURNING id
      )
      SELECT * FROM e
      UNION
        SELECT "id"
        FROM "Device"
        WHERE
          "type" = CAST(${deviceType} as "DeviceType")
          AND "token" = ${deviceToken}
    `;

    const deviceId = res[0].id;

    await this.prisma.$queryRaw<[{ id: string }]>`
      INSERT INTO "WalletSubscription" ("walletAddress", "deviceId")
      VALUES (
        ${walletAddress},
        ${deviceId}::uuid
      )
      ON CONFLICT ("walletAddress", "deviceId")
      DO NOTHING
    `;

    return true;
  }
}