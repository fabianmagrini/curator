import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import type { Request, Response } from 'express';

const nodeHandler = vi.fn(async () => {});
const createCopilotNodeHandler = vi.fn(() => nodeHandler);
const createCopilotRuntimeHandler = vi.fn(() => ({ fetch: vi.fn() }));
const BuiltInAgent = vi.fn();
const CopilotRuntime = vi.fn();

vi.mock('@copilotkit/runtime/v2', () => ({
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
}));
vi.mock('@copilotkit/runtime/v2/node', () => ({ createCopilotNodeHandler }));

const { CopilotKitController } = await import('./copilotkit.controller.js');

const req = {} as Request;
const res = {} as Response;

describe('CopilotKitController (v2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  it('returns 503 and builds no runtime when GOOGLE_API_KEY is unset', async () => {
    const controller = new CopilotKitController();
    await expect(controller.handle(req, res)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(createCopilotNodeHandler).not.toHaveBeenCalled();
    expect(BuiltInAgent).not.toHaveBeenCalled();
  });

  it('builds the v2 runtime once (memoized) and delegates each request when the key is set', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    const controller = new CopilotKitController();

    await controller.handle(req, res);
    await controller.handle(req, res);

    expect(createCopilotNodeHandler).toHaveBeenCalledTimes(1);
    expect(nodeHandler).toHaveBeenCalledTimes(2);
    expect(nodeHandler).toHaveBeenCalledWith(req, res);
    expect(createCopilotRuntimeHandler.mock.calls[0]?.[0]).toMatchObject({
      basePath: '/copilotkit',
    });
    expect(CopilotRuntime).toHaveBeenCalledWith(
      expect.objectContaining({ agents: expect.objectContaining({ default: expect.anything() }) }),
    );
  });

  it('backs the default agent with Gemini, model overridable via GEMINI_MODEL', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    await new CopilotKitController().handle(req, res);
    expect(BuiltInAgent).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'google/gemini-2.5-flash', apiKey: 'test-key' }),
    );

    BuiltInAgent.mockClear();
    process.env.GEMINI_MODEL = 'gemini-2.5-pro';
    await new CopilotKitController().handle(req, res);
    expect(BuiltInAgent).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'google/gemini-2.5-pro' }),
    );
  });
});
