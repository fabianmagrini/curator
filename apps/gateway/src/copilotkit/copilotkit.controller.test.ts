import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import type { Request, Response } from 'express';

const nestHandler = vi.fn(async () => {});
const endpointFactory = vi.fn(() => nestHandler);
const GoogleGenerativeAIAdapter = vi.fn();
const CopilotRuntime = vi.fn();

vi.mock('@copilotkit/runtime', () => ({
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNestEndpoint: endpointFactory,
}));

const { CopilotKitController } = await import('./copilotkit.controller.js');

const req = {} as Request;
const res = {} as Response;

describe('CopilotKitController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  it('returns 503 and builds no runtime when GOOGLE_API_KEY is unset', async () => {
    const controller = new CopilotKitController();
    await expect(controller.handle(req, res)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(endpointFactory).not.toHaveBeenCalled();
    expect(GoogleGenerativeAIAdapter).not.toHaveBeenCalled();
  });

  it('builds the runtime once (memoized) and delegates each request when the key is set', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    const controller = new CopilotKitController();

    await controller.handle(req, res);
    await controller.handle(req, res);

    expect(endpointFactory).toHaveBeenCalledTimes(1);
    expect(nestHandler).toHaveBeenCalledTimes(2);
    expect(nestHandler).toHaveBeenCalledWith(req, res);
    expect(endpointFactory.mock.calls[0]?.[0]).toMatchObject({ endpoint: '/copilotkit' });
  });

  it('uses the default Gemini model, overridable via GEMINI_MODEL', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    await new CopilotKitController().handle(req, res);
    expect(GoogleGenerativeAIAdapter).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-2.5-flash', apiKey: 'test-key' }),
    );

    GoogleGenerativeAIAdapter.mockClear();
    process.env.GEMINI_MODEL = 'gemini-2.5-pro';
    await new CopilotKitController().handle(req, res);
    expect(GoogleGenerativeAIAdapter).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-2.5-pro' }),
    );
  });
});
