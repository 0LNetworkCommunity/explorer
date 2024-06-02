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
import { ValidatorResolver } from "./validators/validator.resvoler.js";

import { AccountResolver } from "./account.resolver.js";

import { TransformerService } from "./transformer.service.js";

import { WalletSubscriptionModule } from "../wallet-subscription/wallet-subscription.module.js";

import { MovementsResolver } from "./movements/movements.resolver.js";
import { MovementsService } from "./movements/movements.service.js";

import { CommunityWalletsResolver } from "./community-wallets/community-wallets.resolver.js";
import { CommunityWalletsService } from "./community-wallets/community-wallets.service.js";

import { TransactionsResolver } from "./transactions/TransactionsResolver.js";
import { TransactionResolver } from "./transactions/TransactionResolver.js";
import { TransactionsFactory } from "./transactions/TransactionsFactory.js";
import { TransactionsRepository } from "./transactions/TransactionsRepository.js";
import { TransactionsService } from "./transactions/TransactionsService.js";
import { Transaction } from "./transactions/Transaction.js";
import { OnChainTransactionsRepository } from "./transactions/OnChainTransactionsRepository.js";
import { ExpiredTransactionsProcessor } from "./transactions/ExpiredTransactionsProcessor.js";
import { BullBoardService } from '../bullboard/bullboard.service.js';

const roles = process.env.ROLES!.split(",");

const workersMap = new Map<string, Type<any>>([
  ["version-batch-processor", OlVersionBatchProcessor],
  ["parquet-producer-processor", OlParquetProducerProcessor],
  ["version-processor", OlVersionProcessor],
  ["clickhouse-ingestor-processor", OlClickhouseIngestorProcessor],
  ["expired-transactions-processor", ExpiredTransactionsProcessor],
]);

const workers: Type<any>[] = [];

for (const role of roles) {
  const worker = workersMap.get(role);
  if (worker) {
    workers.push(worker);
  }
}

// Centralize queue definitions in an array for better reusability
const queues = [
  { name: "ol-clickhouse-ingestor", connection: redisClient},
  { name: "ol-parquet-producer", connection: redisClient },
  { name: "ol-version-batch", connection: redisClient },
  { name: "ol-version", connection: redisClient },
  { name: "expired-transactions", connection: redisClient },
];


@Module({
  imports: [
    S3Module,
    NatsModule,
    PrismaModule,
    ClickhouseModule,
    OlDbModule,
    WalletSubscriptionModule,

    // Register queues using a loop to simplify and maintain consistency
    BullModule.registerQueue(
      ...queues.map(queue => ({
        name: queue.name,
        connection: queue.connection,
      }))
    ),
  ],
  providers: [
    UserTransactionsResolver,
    ModulesResolver,
    MovementsResolver,

    AccountResolver,

    ValidatorResolver,
    ValidatorsResolver,

    CommunityWalletsResolver,
    {
      provide: Types.ICommunityWalletsService,
      useClass: CommunityWalletsService,
    },

    OlService,
    MovementsService,
    TransformerService,

    BullBoardService,

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
  exports: [OlService, TransformerService, Types.ICommunityWalletsService, BullBoardService],
})
export class OlModule {
  isProduction = process.env.NODE_ENV === 'production';

  constructor(private readonly bullBoardService: BullBoardService) {
    if (!this.isProduction) {
      // Setup BullBoard for the queues in local development environment
      // Utilize the same queue array to ensure consistency
      this.bullBoardService.setupBullBoard(queues);
    }
  }
}
