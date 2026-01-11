import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';

  // Validate critical environment variables
  try {
    // Validate BCRYPT_ROUNDS
    const bcryptRounds = parseInt(configService.get<string>('BCRYPT_ROUNDS') || '10', 10);
    if (isNaN(bcryptRounds) || bcryptRounds < 4 || bcryptRounds > 31) {
      throw new Error(`Invalid BCRYPT_ROUNDS: ${bcryptRounds}. Must be between 4 and 31.`);
    }
    logger.log(`✅ Bcrypt rounds: ${bcryptRounds}`);

    // Validate DATABASE_URL
    const databaseUrl = configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured in environment variables');
    }
    logger.log('✅ Database URL configured');

    // Validate JWT_SECRET
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret || jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
      logger.warn('⚠️  WARNING: Using default JWT_SECRET. Change this in production!');
    }
  } catch (error) {
    logger.error(`❌ Configuration Error: ${error.message}`);
    process.exit(1);
  }

  // Security
  app.use(helmet());

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || '*',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('MF-LMS API')
    .setDescription('Microfinance Loan Management System API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Customers', 'Customer management endpoints')
    .addTag('Loans', 'Loan management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔐 Environment: ${configService.get<string>('NODE_ENV') || 'development'}`);
}

bootstrap();