import process from "node:process";
import { Plugin } from "@nestjs/apollo";
import { GraphQLRequestContext } from "@apollo/server";
import { IncomingMessage } from "node:http";
import { Logger } from "@nestjs/common";

type Req = IncomingMessage & {
  _startAt?: NodeJS.HRTime;
};

interface Context {
  req: Req;
}

@Plugin()
export class LoggingPlugin {
  private readonly logger = new Logger(LoggingPlugin.name);

  async requestDidStart(context) {
    const ctx = context as unknown as GraphQLRequestContext<Context>;
    const { operationName } = ctx.request;

    const { req } = context.contextValue;

    req._startAt = process.hrtime()

    return {
      willSendResponse: async () => {
        // time elapsed from request start
        const elapsed = process.hrtime(req._startAt);

        // cover to milliseconds
        const ms = (elapsed[0] * 1e3) + (elapsed[1] * 1e-6);

        const value = ms.toFixed(3);

        this.logger.log(`${operationName} ${value}ms ${req.ip}`);
      },
    };
  }
}
