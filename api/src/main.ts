import 'dotenv/config';
import process from 'node:process';
import { NestFactory } from '@nestjs/core';
import { LogLevel } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app/app.module.js';

function makeLogLevelList(): LogLevel[] {
  const allLogLevels: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'];
  const configuredLevel = (process.env.NESTJS_LOG_LEVEL || 'log') as LogLevel;

  return allLogLevels.slice(
    allLogLevels.indexOf(configuredLevel),
    allLogLevels.length,
  );
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    {
      logger: makeLogLevelList()
    }
  );

  const configService = app.get(ConfigService);

  // Enable graceful shutdown
  app.enableShutdownHooks();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.enableCors();

  const port = configService.get('PORT') || 3000;

  await app.listen(port);

  const environment = configService.get('NODE_ENV') || 'development';
  console.log(`Application running on port ${port} in ${environment} mode`);
}

bootstrap().catch(error => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
