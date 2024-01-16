import { Module } from "@nestjs/common";
import { LoggingPlugin } from "../graphql/logger.plugin.js";

@Module({
  imports: [],
  controllers: [],
  providers: [LoggingPlugin],
})
export class GraphQLModule {}
