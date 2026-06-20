# apps/gateway — AG-UI Gateway (NestJS)

The enterprise **control plane**. Mediates every interaction between the web app and the
agent runtime over AG-UI.

**Stack:** Node.js · NestJS · AG-UI server · SSE (WebSocket optional) · PostgreSQL · Redis

**Owns**
- AuthN / AuthZ, rate limiting.
- Session management; AG-UI event routing and **persistence**; audit logging.
- **Approval brokering**: `APPROVAL_REQUIRED` lifecycle — holds the agent until a human
  resolves it; enforces server-side approval policy (who may approve which rings/quadrants).
- MCP gateway concerns: tool registry, policy enforcement, secret management.

**Boundaries**
- This is where enterprise controls live — **not** in `apps/web`.
- Frontend tools (`useCopilotAction`) are authorized and audited here, per call.
- Tool credentials are held here / in MCP, never sent to the browser.

See [`/AGENTS.md`](../../AGENTS.md) and `docs/spec.md §5, §10, §11, §12`.
