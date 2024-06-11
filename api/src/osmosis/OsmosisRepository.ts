import _ from "lodash";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { BurnEvent, MintEvent, PoolSwapEvent, TransferEvent } from "./types.js";
import { toBytea } from "../utils.js";

@Injectable()
export class OsmosisRepository {

  public constructor(
    private readonly prisma: PrismaService,
  ) {

  }

  public async insertBurnEvent(event: BurnEvent) {
    await this.prisma.$queryRawUnsafe(
      `
        INSERT INTO "OsmosisBurnEvent" (
          "txHash", "index", "date",
          "amount", "burnFromAddress"
        )
        VALUES (
          $1::bytea, $2, $3::timestamp,
          $4::bigint, $5
        )
        ON CONFLICT
        DO NOTHING
      `,
      toBytea(event.txHash),
      event.index,
      event.date,
      event.amount,
      event.burn_from_address,
    );
  }

  public async insertSwapEvent(event: PoolSwapEvent) {
    console.log("Pool Swap Event:", JSON.stringify(event, null, 2));
    /*
    await this.clickhouseService.client.insert({
      table: 'pool_swap_events',
      values: {
        timestamp: event.timestamp,
        sender: event.sender,
        side: event.side,
        amount: event.amount,
        txhash: event.txhash,
      }
    });
    */
  }

  public async insertMintEvent(event: MintEvent) {
    console.log("Mint Event:", JSON.stringify(event, null, 2));
    /*
    await this.clickhouseService.client.insert({
      table: 'mint_events',
      values: {
        timestamp: event.timestamp,
        amount: event.amount,
        mint_to_address: event.mint_to_address,
        txhash: event.txhash,
      }
    });
    */
  }


  public async insertTransferEvent(event: TransferEvent) {
    console.log("Transfer Event:", JSON.stringify(event, null, 2));
    /*
    await this.clickhouseService.client.insert({
      table: 'transfer_events',
      values: {
        timestamp: event.timestamp,
        from_address: event.from_address,
        to_address: event.to_address,
        amount: event.amount,
        txhash: event.txhash,
      }
    });
    */
  }

  public async insertMintEvents(mintEvents: MintEvent[]) {
    if (!mintEvents.length) {
      return;
    }

    const placeholders = mintEvents.map(
      (_, i) =>
        `($${1 + i * 4}::bytea, $${2 + i * 4}, $${3 + i * 4}::bigint, $${4 + i * 4}::timestamp)`,
    );

    const params = _.flatten(
      mintEvents.map((mintEvent) => [
        toBytea(mintEvent.txHash),
        mintEvent.index,
        mintEvent.amount.toString(10),
        mintEvent.date.toISOString(),
      ]),
    );

    const query = `
      INSERT INTO "OsmosisMintEvent"
      ("txHash", "index", "amount", "date")
      VALUES ${placeholders.join(",")}
      ON CONFLICT
      DO NOTHING
    `;

    await this.prisma.$queryRawUnsafe(query, ...params);
  }
}