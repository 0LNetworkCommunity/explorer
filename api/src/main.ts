import 'dotenv/config';
import process from 'node:process';
import { NestFactory, LogLevel } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module.js';
import getConfig from './config/config.js';

function makeLogLevelList(): LogLevel[] {
  // From: https://github.com/nestjs/nest/blob/master/packages/common/services/logger.service.ts#L9
  const allLogLevels: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'];
  // From: https://stackoverflow.com/a/78585135/1701505
  const levels = allLogLevels.slice(
    // TODO: possibly the env var shoud come via dotenv, or Config?
    allLogLevels.indexOf((process.env.NESTJS_LOG_LEVEL || 'log') as LogLevel),
    allLogLevels.length,
  );
  return levels;
}

async function bootstrap() {
  const config = getConfig();

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    {
      logger: makeLogLevelList()
    }
  );

  app.enableShutdownHooks();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.enableCors();

  await app.listen(config.port);
}
bootstrap();
