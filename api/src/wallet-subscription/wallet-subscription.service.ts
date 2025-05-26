import { Injectable } from '@nestjs/common';
import apn from '@parse/node-apn';
import { DeviceType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { ClickhouseService } from '../clickhouse/clickhouse.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApnConfig } from '../config/config.interface.js';
import { ReleaseVersionJobData } from './wallet-subscription.processor.js';
import { FirebaseService } from '../firebase/firebase.service.js';

@Injectable()
export class WalletSubscriptionService {
  private readonly apnProvider?: apn.Provider;

  public constructor(
    config: ConfigService,
    private readonly clickhouseService: ClickhouseService,
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,

    @InjectQueue('wallet-subscription')
    private readonly walletSubscriptionQueue: Queue,
  ) {
    const apnConfig = config.get<ApnConfig>('apn');
    if (apnConfig) {
      this.apnProvider = new apn.Provider({
        production: false,
        token: {
          keyId: apnConfig.keyId,
          teamId: apnConfig.teamId,
          key: apnConfig.privateKey,
        },
      });
    }
  }

  public async releaseVersion(version: string) {
    await this.walletSubscriptionQueue.add('releaseVersion', { version } as ReleaseVersionJobData, {
      jobId: `__version__${version}`,
    });
  }

  public async processReleaseVersionJob(version: string) {
    if (!this.apnProvider) {
      return;
    }

    {
      const result = await this.clickhouseService.client.query({
        query: `
          SELECT
          tupleElement("entry", 2) / 1e6 AS "balance",
          hex(tupleElement("entry", 3)) AS "address"
          FROM (
            SELECT
              arrayElement(
                arraySort(
                  (x) -> tupleElement(x, 1) ,
                  groupArray(
                    tuple(
                      "change_index",
                      "balance",
                      "address"
                    )
                  )
                ),
                -1
              ) AS "entry"
            FROM olfyi."coin_balance"
            WHERE
              "version" = {version: UInt64}
            AND
              "coin_module" = 'libra_coin'
            GROUP BY "address"
          )
        `,
        query_params: { version },
        format: 'JSONCompact',
      });

      const rows = await result.json<[number, string]>();
      const balances = rows.data;
      const addresses = balances.map(([_, address]) => Buffer.from(address, 'hex'));

      const subscriptions = await this.prisma.walletSubscription.findMany({
        where: {
          walletAddress: {
            in: addresses,
          },
        },
        include: {
          device: true,
        },
      });

      for (const subscription of subscriptions) {
        const walletAddress = subscription.walletAddress.toString('hex').toUpperCase();
        const slowWallet = balances.find((it) => it[1] === walletAddress)!;

        switch (subscription.device.type) {
          case DeviceType.IOS:
            {
              const note = new apn.Notification();
              note.expiry = Math.floor(Date.now() / 1e3) + 3_600; // Expires 1 hour from now.
              note.alert = `New balance Ƚ ${slowWallet[0].toLocaleString('en-US')} on version ${BigInt(version).toLocaleString('en-US')}`;
              note.payload = {
                messageFrom: 'John Appleseed',
              };
              note.topic = 'app.postero.postero';

              const res = await this.apnProvider.send(note, subscription.device.token);
              console.log('res', res);
            }
            break;

          case DeviceType.ANDROID:
            {
              const { app } = this.firebaseService;

              if (app) {
                const res = await app.messaging().send({
                  token: subscription.device.token,
                  notification: {
                    title: `New balance Ƚ ${slowWallet[0].toLocaleString('en-US')}`,
                    body: `Version ${BigInt(version).toLocaleString('en-US')}`,
                  },
                  data: {
                    story_id: 'story_12345',
                  },
                });
                console.log('res', res);
              }
            }
            break;
        }
      }
    }

    {
      const result = await this.clickhouseService.client.query({
        query: `
          SELECT
            tupleElement("entry", 2) / 1e6 AS "unlocked",
            hex(tupleElement("entry", 3)) AS "address"
          FROM (
            SELECT
              arrayElement(
                arraySort(
                  (x) -> tupleElement(x, 1) ,
                  groupArray(
                    tuple(
                      "change_index",
                      "unlocked",
                      "address"
                    )
                  )
                ),
                -1
              ) AS "entry"
            FROM "slow_wallet"
            WHERE
              "version" = {version: UInt64}
            GROUP BY "address"
          )
        `,
        query_params: { version },
        format: 'JSONCompact',
      });

      const rows = await result.json<[number, string]>();

      const slowWallets = rows.data;
      const addresses = slowWallets.map(([_, address]) => Buffer.from(address, 'hex'));

      const subscriptions = await this.prisma.walletSubscription.findMany({
        where: {
          walletAddress: {
            in: addresses,
          },
        },
        include: {
          device: true,
        },
      });

      for (const subscription of subscriptions) {
        const walletAddress = subscription.walletAddress.toString('hex').toUpperCase();
        const slowWallet = slowWallets.find((it: any) => it[1] === walletAddress)!;

        switch (subscription.device.type) {
          case DeviceType.IOS:
            {
              const note = new apn.Notification();
              note.expiry = Math.floor(Date.now() / 1e3) + 3_600; // Expires 1 hour from now.
              note.alert = `New unlocked amount Ƚ ${slowWallet[0].toLocaleString('en-US')} on version ${BigInt(version).toLocaleString('en-US')}`;
              note.payload = {
                messageFrom: 'John Appleseed',
              };
              note.topic = 'app.postero.postero';

              const res = await this.apnProvider.send(note, subscription.device.token);
              console.log('res', res);
            }
            break;

          case DeviceType.ANDROID:
            {
              const { app } = this.firebaseService;

              if (app) {
                const res = await app.messaging().send({
                  token: subscription.device.token,
                  notification: {
                    title: `New unlocked amount Ƚ ${slowWallet[0].toLocaleString('en-US')}`,
                    body: `Version ${BigInt(version).toLocaleString('en-US')}`,
                  },
                  data: {
                    story_id: 'story_12345',
                  },
                });
                console.log('res', res);
              }
            }
            break;
        }
      }
    }
  }
}
