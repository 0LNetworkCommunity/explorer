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

function configureCors(app: NestExpressApplication, configService: ConfigService) {
  const environment = configService.get('NODE_ENV') || 'development';

  if (environment === 'development') {
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    console.log('CORS enabled for development environment');
  } else {
    const allowedOrigins = configService.get('ALLOWED_ORIGINS');
    app.enableCors({
      origin: allowedOrigins ? allowedOrigins.split(',') : false,
      methods: 'GET,HEAD,POST,OPTIONS',
      credentials: false,
    });
    console.log(`CORS configured for ${environment} environment`);
  }
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

  // Environment-aware CORS configuration
  configureCors(app, configService);

  const port = configService.get('PORT') || 3000;

  await app.listen(port);

  const environment = configService.get('NODE_ENV') || 'development';
  console.log(`Application running on port ${port} in ${environment} mode`);
}

bootstrap().catch(error => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
