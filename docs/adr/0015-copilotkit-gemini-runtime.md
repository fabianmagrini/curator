# 0015. CopilotKit UX layer backed by a gated Gemini runtime

- Date: 2026-06-28
- Status: Accepted

## Context

Phase 1 deferred CopilotKit as "LLM-gated" ([backlog](../backlog.md)): the web app shipped a
direct AG-UI SSE client and a technology picker, but no conversational entry point or agent-driven
UI navigation (spec §9.2). CopilotKit is the chosen UX acceleration layer
([ADR-0003](0003-copilotkit-ux-only-control-in-gateway.md)), and it needs a server-side LLM runtime
to function. The agent **evaluation** runtime is intended to be VoltAgent + Claude
([ADR-0006](0006-voltagent-as-agent-runtime.md)), but that pipeline is currently deterministic and
seeded, and the conversational sidebar is a separate concern. Standing up an LLM dependency must
not break the deterministic demo or CI, which run with no keys.

## Decision

Host the CopilotKit runtime in the **gateway** ([ADR-0003](0003-copilotkit-ux-only-control-in-gateway.md),
[ADR-0009](0009-nestjs-for-the-gateway.md)) at `POST/GET /copilotkit`, backed by **Google Gemini**
via CopilotKit's `GoogleGenerativeAIAdapter` (model from `GEMINI_MODEL`, default `gemini-2.5-flash`).
The provider key stays server-side (spec §12).

The feature is **opt-in**, mirroring the `DATABASE_URL` persistence gate
([ADR-0013](0013-postgres-gateway-persistence.md)):

- **Server gate** — with no `GOOGLE_API_KEY`, the endpoint returns `503` and constructs no adapter.
- **Web gate** — the CopilotKit provider + sidebar mount only when `VITE_COPILOT_RUNTIME_URL` is set;
  otherwise the app renders its default direct-SSE experience unchanged.

On the web, the sidebar exposes radar/selection state via `useCopilotReadable` and lets the agent
drive UI navigation via `useCopilotAction` (`selectTechnology`, `highlightRing`) — read-only
navigation only; the browser never writes radar state ([ADR-0003](0003-copilotkit-ux-only-control-in-gateway.md)).
The CopilotKit hooks live in a `CopilotBindings` child rendered only under the provider, so `App`
stays provider-free.

## Consequences

- Closes the last open Phase 1 item; chat + agent-driven UI work end-to-end when a key is present.
- Introduces a **second LLM vendor** (Gemini) for the UX layer. This does not contradict
  [ADR-0006](0006-voltagent-as-agent-runtime.md), which governs the evaluation runtime, not the chat
  layer. The adapter is a one-line swap (`AnthropicAdapter`, `OpenAIAdapter`, …) behind the same
  endpoint if we consolidate vendors later.
- CI and the seeded demo are unaffected — both run with the feature gated off.
- CopilotKit pulls a sizable client bundle (markdown/syntax rendering); it loads as separate chunks
  and only when the sidebar is enabled.
- Uses CopilotKit's v1 `copilotRuntimeNestEndpoint`; if a future version removes it, the v2
  `createCopilotRuntimeHandler` mounts in the same controller.
- CopilotKit's v1 barrel eagerly imports **all** its LLM adapters, so even though we only use Gemini,
  the gateway must carry CopilotKit's optional peer SDKs as dependencies (`openai`, `groq-sdk`,
  `@anthropic-ai/sdk`, pinned to the ranges CopilotKit expects) or the runtime fails to load at boot.
