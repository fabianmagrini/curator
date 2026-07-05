import { All, Controller, Req, Res, ServiceUnavailableException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BuiltInAgent, CopilotRuntime, createCopilotRuntimeHandler } from '@copilotkit/runtime/v2';
import { createCopilotNodeHandler } from '@copilotkit/runtime/v2/node';

const BASE_PATH = '/copilotkit';
const DEFAULT_MODEL = 'gemini-2.5-flash';

type NodeHandler = ReturnType<typeof createCopilotNodeHandler>;

/**
 * Hosts the CopilotKit **v2** runtime as the UX/conversation layer (ADR-0003,
 * ADR-0015, ADR-0016). A single Gemini-backed `BuiltInAgent` is registered as
 * `default`, resolved through the AI SDK's Google provider (bundled with the
 * runtime) — so, unlike the v1 adapter barrel, the gateway carries no unused LLM
 * SDKs. The feature is **opt-in**: with no `GOOGLE_API_KEY` the endpoint reports
 * 503 and no runtime is constructed (mirrors the `DATABASE_URL` persistence gate).
 */
@Controller('copilotkit')
export class CopilotKitController {
  private handler: NodeHandler | null = null;

  /** Build the v2 runtime once, lazily, only when a key is present. */
  private resolveHandler(): NodeHandler | null {
    if (this.handler) return this.handler;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;

    const agent = new BuiltInAgent({
      model: `google/${process.env.GEMINI_MODEL ?? DEFAULT_MODEL}`,
      apiKey,
    });
    const runtime = new CopilotRuntime({ agents: { default: agent } });
    this.handler = createCopilotNodeHandler(
      createCopilotRuntimeHandler({ runtime, basePath: BASE_PATH }),
    );
    return this.handler;
  }

  /** `POST/GET /copilotkit` — CopilotKit's AG-UI transport for chat + frontend tools. */
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
