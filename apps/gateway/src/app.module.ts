import { Module } from '@nestjs/common';
import type { Pool } from 'pg';
import { HealthController } from './health/health.controller.js';
import { AgUiController } from './agui/agui.controller.js';
import { CopilotKitController } from './copilotkit/copilotkit.controller.js';
import { AgUiService } from './agui/agui.service.js';
import { ApprovalRegistry } from './agui/approval-registry.js';
import { ApprovalPolicy } from './agui/approval-policy.js';
import { EventStore, InMemoryEventStore } from './store/event-store.js';
import { AuditStore, InMemoryAuditStore } from './store/audit-store.js';
import { PostgresEventStore } from './store/postgres-event-store.js';
import { PostgresAuditStore } from './store/postgres-audit-store.js';
import { PG_POOL, createPool } from './store/database.js';

@Module({
  controllers: [HealthController, AgUiController, CopilotKitController],
  providers: [
    AgUiService,
    ApprovalRegistry,
    ApprovalPolicy,
    // Persistence: Postgres when DATABASE_URL is set, else in-memory (ADR-0012, ADR-0013).
    { provide: PG_POOL, useFactory: createPool },
    {
      provide: EventStore,
      inject: [PG_POOL],
      useFactory: (pool: Pool | null) =>
        pool ? new PostgresEventStore(pool) : new InMemoryEventStore(),
    },
    {
      provide: AuditStore,
      inject: [PG_POOL],
      useFactory: (pool: Pool | null) =>
        pool ? new PostgresAuditStore(pool) : new InMemoryAuditStore(),
    },
  ],
})
export class AppModule {}
