import { Controller, Query, Sse, type MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AgUiService } from './agui.service.js';

@Controller('agui')
export class AgUiController {
  constructor(private readonly aguiService: AgUiService) {}

  /**
   * SSE endpoint streaming AG-UI events for a single agent run.
   * `GET /agui/stream?prompt=Should%20we%20move%20gRPC%20to%20Trial%3F`
   */
  @Sse('stream')
  stream(
    @Query('prompt') prompt?: string,
    @Query('technologyId') technologyId?: string,
  ): Observable<MessageEvent> {
    return this.aguiService.streamRun(prompt ?? 'Evaluate the radar', technologyId);
  }
}
