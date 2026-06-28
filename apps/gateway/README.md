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

## Status

NestJS control plane. Endpoints: `GET /health`; SSE `GET /agui/stream?prompt=…&technologyId=…`
(streams a run and **blocks at the approval gate**); `POST /agui/approvals/:id`
(`{ decision, rationale?, dissent? }`) to resolve it; `GET /agui/audit` for the decision trail.
Per-session event persistence + audit sit behind the `EventStore` / `AuditStore` interfaces:
**in-memory by default, Postgres when `DATABASE_URL` is set** (ADR-0012, ADR-0013; local DB via
`docker compose up -d`). Approval brokering blocks the agent run via an injected await hook
(ADR-0011). Run with `pnpm dev:gateway` (port 4000; `PORT` / `WEB_ORIGIN` / `DATABASE_URL`).
Still missing: authn/authz, server-side approval policy, MCP, rate limiting.

See [`/AGENTS.md`](../../AGENTS.md) and `docs/spec.md §5, §10, §11, §12`.
