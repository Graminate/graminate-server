import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import * as cron from 'node-cron';
import { cleanupExpiredSessions } from './utils/jobs/session-cleanup.job';

cron.schedule('0 * * * *', cleanupExpiredSessions); // Session cleanup per hour

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(
    '/api/user/login',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 min
      max: 10, // limit each IP to 10 login requests
      message: {
        status: 429,
        error: 'Too many login attempts. Please try again later.',
      },
    }),
  );
  app.use(helmet());
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://eu.ui-avatars.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    }),
  );

  app.use(
    csurf({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      },
    }),
  );

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(3001);
}
bootstrap();
