import { NestFactory } from '@nestjs/core';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app/app.module.js';

async function bootstrap() {
  // Create Express instance
  const expressApp = express();

  // These Express-specific settings should be applied to the Express instance
  expressApp.disable('x-powered-by');
  expressApp.set('trust proxy', 1);

  // Create NestJS app with the Express adapter
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  // Get environment from config service
  const configService = app.get(ConfigService);
  const environment = configService.get('NODE_ENV') || 'development';

  // Enable CORS only for development environment
  if (environment === 'development') {
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    console.log('CORS enabled for development environment');
  } else {
    // For production, either disable CORS or use a strict configuration
    app.enableCors({
      origin: configService.get('ALLOWED_ORIGINS')?.split(',') || false,
      methods: 'GET,HEAD,POST,OPTIONS',
      credentials: false,
    });
    console.log(`CORS configured for ${environment} environment`);
  }

  const port = configService.get('PORT') || 3000;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
