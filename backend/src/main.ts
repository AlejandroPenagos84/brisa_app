import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { ApplicationExceptionFilter } from './infrastructure/http/filters/application-exception.filter.js';
import { DatabaseExceptionFilter } from './infrastructure/http/filters/database-exception.filter.js';
import { DomainExceptionFilter } from './infrastructure/http/filters/domain-exception.filter.js';
import {
  UPLOADS_DIR,
  UPLOADS_URL_PREFIX,
} from './infrastructure/storage/local-disk-property-image-storage.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);

  const frontendOrigins = process.env.FRONTEND_ORIGINS;
  app.enableCors({
    origin: frontendOrigins
      ? frontendOrigins.split(',').map((origin) => origin.trim())
      : /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  });

  // Uploaded property images, read only. nosniff: the browser uses the
  // Content-Type from the extension and does not guess another one
  app.useStaticAssets(UPLOADS_DIR, {
    prefix: UPLOADS_URL_PREFIX,
    index: false,
    dotfiles: 'deny',
    fallthrough: true,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });

  app.useGlobalFilters(
    new DatabaseExceptionFilter(httpAdapter),
    new DomainExceptionFilter(),
    new ApplicationExceptionFilter(),
  );

  // Validates request DTOs with their class-validator decorators.
  // whitelist + forbidNonWhitelisted: fields not declared in the DTO return 400
  // transform: converts query strings with @Type, e.g. price filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Brisa API')
    .setDescription(
      'REST API for managing properties, clients, owners, rentals, banks, cities and countries.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
