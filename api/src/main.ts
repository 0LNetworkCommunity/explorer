import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module.js';
import getConfig from './config/config.js';

async function bootstrap() {
  const config = getConfig();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableShutdownHooks();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.enableCors();

  await app.listen(config.port);
}
bootstrap();
