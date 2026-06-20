import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';

const PORT = Number(process.env.PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // The web app connects over SSE from a different origin in dev.
  app.enableCors({ origin: WEB_ORIGIN });
  await app.listen(PORT);
  Logger.log(`AG-UI gateway listening on http://localhost:${PORT}`, 'Bootstrap');
}

void bootstrap();
