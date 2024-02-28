import { Module } from "@nestjs/common";
import { LoggingPlugin } from "../graphql/logger.plugin.js";
import { BytesScalar } from "./bytes.scalar.js";

@Module({
  imports: [],
  controllers: [],
  providers: [LoggingPlugin, BytesScalar],
})
export class GraphQLModule {}
