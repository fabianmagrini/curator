import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { AgUiController } from './agui/agui.controller.js';
import { AgUiService } from './agui/agui.service.js';

@Module({
  controllers: [HealthController, AgUiController],
  providers: [AgUiService],
})
export class AppModule {}
