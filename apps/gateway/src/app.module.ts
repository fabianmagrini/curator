import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { AgUiController } from './agui/agui.controller.js';
import { AgUiService } from './agui/agui.service.js';
import { ApprovalRegistry } from './agui/approval-registry.js';
import { EventStore, InMemoryEventStore } from './store/event-store.js';
import { AuditStore, InMemoryAuditStore } from './store/audit-store.js';

@Module({
  controllers: [HealthController, AgUiController],
  providers: [
    AgUiService,
    ApprovalRegistry,
    // In-memory persistence behind interfaces; swap to Postgres later (ADR-0012).
    { provide: EventStore, useClass: InMemoryEventStore },
    { provide: AuditStore, useClass: InMemoryAuditStore },
  ],
})
export class AppModule {}
