import { Injectable } from '@nestjs/common';
import type { AgUiEvent } from '@curator/agents';

/**
 * Persists the AG-UI event stream per session (spec §5, §11). Abstract + async so
 * the in-memory implementation can be swapped for Postgres without touching
 * callers (ADR-0012, ADR-0013). Used as the DI token.
 */
export abstract class EventStore {
  abstract append(sessionId: string, event: AgUiEvent): Promise<void>;
  abstract bySession(sessionId: string): Promise<AgUiEvent[]>;
}

@Injectable()
export class InMemoryEventStore extends EventStore {
  private readonly events = new Map<string, AgUiEvent[]>();

  append(sessionId: string, event: AgUiEvent): Promise<void> {
    const list = this.events.get(sessionId);
    if (list) {
      list.push(event);
    } else {
      this.events.set(sessionId, [event]);
    }
    return Promise.resolve();
  }

  bySession(sessionId: string): Promise<AgUiEvent[]> {
    return Promise.resolve(this.events.get(sessionId) ?? []);
  }
}
