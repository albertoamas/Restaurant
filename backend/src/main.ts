import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaService } from './modules/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers
  app.use(helmet());

  // Serve uploaded images as static files: GET /uploads/<filename>
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.setGlobalPrefix('api/v1');

  // Global exception filter — consistent error shape, no stack trace leaks
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const frontendUrl = process.env.FRONTEND_URL;
  if (process.env.NODE_ENV === 'production') {
    if (!frontendUrl) throw new Error('FRONTEND_URL environment variable is required in production');
    if (!process.env.ADMIN_SECRET) throw new Error('ADMIN_SECRET environment variable is required in production');
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required in production');
  }
  app.enableCors({
    origin: frontendUrl || 'http://localhost:5173',
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  // Health check — registered before listen() so Express processes it
  // before NestJS installs its catch-all 404 handler
  const prisma = app.get(PrismaService);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/health', async (_req: unknown, res: import('express').Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'error', timestamp: new Date().toISOString() });
    }
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`POS API running on http://localhost:${port}/api/v1`);
}
bootstrap();
