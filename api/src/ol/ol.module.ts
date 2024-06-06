import process from "node:process";

import { BullModule } from "@nestjs/bullmq";
import { Module, Scope, Type } from "@nestjs/common";

import { redisClient } from "../redis/redis.service.js";
import { ClickhouseModule } from "../clickhouse/clickhouse.module.js";
import { ModulesResolver } from "./modules.resolver.js";
import { OlService } from "./ol.service.js";
import { S3Module } from "../s3/s3.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { NatsModule } from "../nats/nats.module.js";

import { Types } from "../types.js";

import { UserTransactionsResolver } from "./user-transactions.resolver.js";

import { OlVersionBatchProcessor } from "./ol-version-batch.processor.js";
import { OlVersionProcessor } from "./ol-version.processor.js";
import { OlDbModule } from "../ol-db/ol-db.module.js";
import { OlParquetProducerProcessor } from "./ol-parquet-producer.processor.js";
import { OlClickhouseIngestorProcessor } from "./ol-clickhouse-ingestor.processor.js";
import { OlController } from "./ol.controller.js";

import { ValidatorsResolver } from "./validators/validators.resolver.js";
import { ValidatorsProcessor } from "./validators/validators.processor.js";
import { ValidatorsService } from "./validators/validators.service.js";

import { AccountResolver } from "./account.resolver.js";
import { AccountsResolver } from "./accounts/accounts.resolver.js";
import { AccountsService } from "./accounts/accounts.service.js";
import { AccountsProcessor } from "./accounts/accounts.processor.js";

import { TransformerService } from "./transformer.service.js";

import { WalletSubscriptionModule } from "../wallet-subscription/wallet-subscription.module.js";

import { MovementsResolver } from "./movements/movements.resolver.js";
import { MovementsService } from "./movements/movements.service.js";

import { CommunityWalletsResolver } from "./community-wallets/community-wallets.resolver.js";
import { CommunityWalletsService } from "./community-wallets/community-wallets.service.js";
import { CommunityWalletsProcessor } from "./community-wallets/community-wallets.processor.js";

import { TransactionsResolver } from "./transactions/TransactionsResolver.js";
import { TransactionResolver } from "./transactions/TransactionResolver.js";
import { TransactionsFactory } from "./transactions/TransactionsFactory.js";
import { TransactionsRepository } from "./transactions/TransactionsRepository.js";
import { TransactionsService } from "./transactions/TransactionsService.js";
import { Transaction } from "./transactions/Transaction.js";
import { OnChainTransactionsRepository } from "./transactions/OnChainTransactionsRepository.js";
import { ExpiredTransactionsProcessor } from "./transactions/ExpiredTransactionsProcessor.js";

const roles = process.env.ROLES!.split(",");

const workersMap = new Map<string, Type<any>>([
  ["version-batch-processor", OlVersionBatchProcessor],
  ["parquet-producer-processor", OlParquetProducerProcessor],
  ["version-processor", OlVersionProcessor],
  ["clickhouse-ingestor-processor", OlClickhouseIngestorProcessor],
  ["expired-transactions-processor", ExpiredTransactionsProcessor],
  ["accounts-processor", AccountsProcessor],
]);

const workers: Type<any>[] = [];

for (const role of roles) {
  const worker = workersMap.get(role);
  if (worker) {
    workers.push(worker);
  }
}

@Module({
  imports: [
    S3Module,
    NatsModule,
    PrismaModule,
    ClickhouseModule,
    OlDbModule,
    WalletSubscriptionModule,

    BullModule.registerQueue({
      name: "ol-clickhouse-ingestor",
      connection: redisClient,
    }),

    BullModule.registerQueue({
      name: "ol-parquet-producer",
      connection: redisClient,
    }),

    BullModule.registerQueue({
      name: "ol-version-batch",
      connection: redisClient,
    }),

    BullModule.registerQueue({
      name: "ol-version",
      connection: redisClient,
    }),

    BullModule.registerQueue({
      name: "expired-transactions",
      connection: redisClient,
    }),

    BullModule.registerQueue({
      name: "accounts",
      connection: redisClient,
    }),

    BullModule.registerQueue({
      name: "community-wallets",
      connection: redisClient,
    }),

    BullModule.registerQueue({
      name: "validators",
      connection: redisClient,
    }),
  ],
  providers: [
    UserTransactionsResolver,
    ModulesResolver,
    MovementsResolver,

    AccountResolver,
    AccountsResolver,
    AccountsService,
    AccountsProcessor,

    ValidatorsResolver,
    ValidatorsService,
    ValidatorsProcessor,

    CommunityWalletsResolver,
    CommunityWalletsService,
    CommunityWalletsProcessor,
    {
      provide: Types.ICommunityWalletsService,
      useClass: CommunityWalletsService,
    },

    OlService,
    MovementsService,
    TransformerService,

    // Transactions
    TransactionResolver,
    TransactionsResolver,
    {
      provide: Types.IOnChainTransactionsRepository,
      useClass: OnChainTransactionsRepository,
    },
    {
      provide: Types.ITransactionsRepository,
      useClass: TransactionsRepository,
    },
    {
      provide: Types.ITransactionsService,
      useClass: TransactionsService,
    },
    {
      provide: Types.ITransactionsFactory,
      useClass: TransactionsFactory,
    },
    {
      provide: Types.ITransaction,
      useClass: Transaction,
      scope: Scope.TRANSIENT,
    },

    ...workers,
  ],
  controllers: [OlController],
  exports: [OlService, TransformerService, Types.ICommunityWalletsService],
})
export class OlModule {}
