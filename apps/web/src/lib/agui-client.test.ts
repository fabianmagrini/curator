import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveApproval } from './agui-client.js';

afterEach(() => {
  vi.restoreAllMocks();
});

/** Stub `fetch` with a programmed Response and capture the call for assertions. */
function stubFetch(response: Partial<Response>) {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response as Response);
  return fetchMock;
}

describe('resolveApproval', () => {
  it('POSTs the decision with the approver-role header and JSON body', async () => {
    const fetchMock = stubFetch({ ok: true, status: 200 });

    await resolveApproval('a1', 'approve', { rationale: 'looks good', dissent: 'noted' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toMatch(/\/agui\/approvals\/a1$/);
    expect(init.method).toBe('POST');

    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    // The gateway authorizes per call; the browser only advertises a role (ADR-0014).
    expect(headers['x-approver-role']).toBe('architect');

    expect(JSON.parse(init.body as string)).toEqual({
      decision: 'approve',
      rationale: 'looks good',
      dissent: 'noted',
    });
  });

  it('omits absent optional fields from the body', async () => {
    const fetchMock = stubFetch({ ok: true, status: 200 });

    await resolveApproval('a1', 'reject');

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ decision: 'reject' });
  });

  it('throws with the status when the gateway rejects the decision (e.g. 403)', async () => {
    stubFetch({ ok: false, status: 403 });

    await expect(resolveApproval('a1', 'approve')).rejects.toThrow(/403/);
  });
});
