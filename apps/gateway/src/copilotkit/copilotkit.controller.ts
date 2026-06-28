import { All, Controller, Req, Res, ServiceUnavailableException } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNestEndpoint,
} from '@copilotkit/runtime';

const ENDPOINT = '/copilotkit';
const DEFAULT_MODEL = 'gemini-2.5-flash';

type RuntimeHandler = ReturnType<typeof copilotRuntimeNestEndpoint>;

/**
 * Hosts the CopilotKit runtime as the UX/conversation layer (ADR-0003, ADR-0015).
 * The LLM is Google Gemini via CopilotKit's `GoogleGenerativeAIAdapter`; the key
 * stays server-side. The feature is **opt-in**: with no `GOOGLE_API_KEY` the
 * endpoint reports 503 and no adapter is constructed, so CI and the seeded demo
 * are unaffected (mirrors the `DATABASE_URL` persistence opt-in).
 */
@Controller('copilotkit')
export class CopilotKitController {
  private handler: RuntimeHandler | null = null;

  /** Build the runtime+adapter once, lazily, only when a key is present. */
  private resolveHandler(): RuntimeHandler | null {
    if (this.handler) return this.handler;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;

    const serviceAdapter = new GoogleGenerativeAIAdapter({
      model: process.env.GEMINI_MODEL ?? DEFAULT_MODEL,
      apiKey,
    });
    const runtime = new CopilotRuntime();
    this.handler = copilotRuntimeNestEndpoint({ runtime, serviceAdapter, endpoint: ENDPOINT });
    return this.handler;
  }

  /** `POST/GET /copilotkit` — CopilotKit's GraphQL transport for chat + actions. */
  @All()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    const handler = this.resolveHandler();
    if (!handler) {
      throw new ServiceUnavailableException(
        'CopilotKit runtime is disabled; set GOOGLE_API_KEY to enable it.',
      );
    }
    await handler(req, res);
  }
}
