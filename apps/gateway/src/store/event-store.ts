import { Injectable } from '@nestjs/common';
import type { AgUiEvent } from '@curator/agents';

/**
 * Persists the AG-UI event stream per session (spec §5, §11). Abstract so the
 * in-memory implementation can be swapped for Postgres later without touching
 * callers (ADR-0012). Used as the DI token.
 */
export abstract class EventStore {
  abstract append(sessionId: string, event: AgUiEvent): void;
  abstract bySession(sessionId: string): AgUiEvent[];
}

@Injectable()
export class InMemoryEventStore extends EventStore {
  private readonly events = new Map<string, AgUiEvent[]>();

  append(sessionId: string, event: AgUiEvent): void {
    const list = this.events.get(sessionId);
    if (list) {
      list.push(event);
    } else {
      this.events.set(sessionId, [event]);
    }
  }

  bySession(sessionId: string): AgUiEvent[] {
    return this.events.get(sessionId) ?? [];
  }
}
