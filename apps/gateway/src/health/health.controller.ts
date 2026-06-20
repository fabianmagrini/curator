import { Controller, Get } from '@nestjs/common';

interface HealthStatus {
  status: 'ok';
  service: string;
  timestamp: string;
}

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthStatus {
    return {
      status: 'ok',
      service: 'agui-gateway',
      timestamp: new Date().toISOString(),
    };
  }
}
