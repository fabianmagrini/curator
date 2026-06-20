import { Injectable, type MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { runPlanner, type AgUiEvent } from '@curator/agents';

/**
 * Bridges the agent runtime to the AG-UI SSE transport. For Phase 0 it simply
 * relays the no-op planner's event stream. Later this is where session
 * management, event persistence, audit logging, and approval brokering live
 * (spec §5, §10, §11).
 */
@Injectable()
export class AgUiService {
  /** Stream one agent run as a sequence of AG-UI events over SSE. */
  streamRun(prompt: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let cancelled = false;

      void (async () => {
        try {
          for await (const event of runPlanner({ prompt })) {
            if (cancelled) return;
            subscriber.next(this.toMessageEvent(event));
          }
          subscriber.complete();
        } catch (err) {
          subscriber.error(err);
        }
      })();

      return () => {
        cancelled = true;
      };
    });
  }

  private toMessageEvent(event: AgUiEvent): MessageEvent {
    // Deliberately omit `type` so every event arrives on the browser's default
    // `message` handler; the AG-UI event type travels in the payload (`data.type`).
    return {
      id: String(event.seq),
      data: event,
    };
  }
}
