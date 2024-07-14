import { Module } from '@nestjs/common';
import { LoggingPlugin } from '../graphql/logger.plugin.js';
import { BytesScalar } from './bytes.scalar.js';
import { BigIntScalar } from './bigint.scalar.js';
import { DecimalScalar } from './decimal.scalar.js';

@Module({
  imports: [],
  controllers: [],
  providers: [LoggingPlugin, BytesScalar, BigIntScalar, DecimalScalar],
})
export class GraphQLModule {}
