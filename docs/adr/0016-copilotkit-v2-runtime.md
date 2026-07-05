# 0016. Adopt the CopilotKit v2 runtime

- Date: 2026-07-05
- Status: Accepted

## Context

[ADR-0015](0015-copilotkit-gemini-runtime.md) shipped the CopilotKit UX layer on CopilotKit's **v1**
runtime. v1's single entry point is a barrel that eagerly imports _every_ LLM adapter, so a
Gemini-only gateway had to carry three otherwise-unused SDKs (`openai`, `groq-sdk`,
`@anthropic-ai/sdk`) purely so the runtime would load at boot — and v1's `copilotRuntimeNestEndpoint`
was already labelled "legacy". The decision in ADR-0015 (CopilotKit UX layer + gated Gemini) stands;
only its runtime mechanism is revisited here.

CopilotKit **v2** (shipped in the same installed `@copilotkit/*@1.61` packages under `/v2` subpaths)
replaces the adapter barrel with an **AG-UI agent** model built on the Vercel AI SDK: a `BuiltInAgent`
is given a `provider/model` string and only that provider package loads. v2 statically imports none of
the three peer SDKs.

## Decision

Migrate both ends to v2:

- **Gateway** — `POST/GET /copilotkit` builds a v2 `CopilotRuntime` with one `BuiltInAgent` registered
  as `default`, `model: "google/${GEMINI_MODEL}"` (default `gemini-2.5-flash`), `apiKey` from
  `GOOGLE_API_KEY`. Mounted via `createCopilotNodeHandler(createCopilotRuntimeHandler({ runtime, basePath }))`
  inside the existing gated `@All('copilotkit')` controller. The three v1 peer SDKs **and** the v1
  `@google/generative-ai` client are removed; the Gemini provider (`@ai-sdk/google`) is already bundled
  with the runtime.
- **Web** — provider, sidebar, and hooks move to `@copilotkit/react-core/v2`
  (`@copilotkit/react-ui` is dropped). Hook renames: `useCopilotReadable` → `useAgentContext`
  (same `{description, value}`), `useCopilotAction` → `useFrontendTool` (parameters now a **Standard
  Schema** — Zod — instead of a descriptor array). `CopilotBindings` is lazy-loaded so the v2 bundle +
  CSS load only when enabled.

The opt-in contract is **unchanged**: gate on `GOOGLE_API_KEY` (server) and `VITE_COPILOT_RUNTIME_URL`
(web); no key → 503; `GEMINI_MODEL` still overrides the model. No env vars renamed.

## Consequences

- The gateway no longer carries three unused LLM SDKs; the dependency surface shrinks to what Gemini
  actually needs. Verified: with the SDKs removed, the gateway boots cleanly and `/copilotkit` returns
  503 when gated off — no `ERR_MODULE_NOT_FOUND` (v1 crashed here).
- Off the "legacy" v1 endpoint and onto the AG-UI-native path; swapping Gemini for another provider is
  a one-string change, or a LangGraph/other AG-UI agent, with no frontend change.
- Lazy-loading `CopilotBindings` also keeps the (large) CopilotKit chunk out of the default bundle and
  out of the provider-free web tests.
- New web dependency `zod` (Standard Schema for frontend-tool parameters); already transitive.
- v2 is newer than v1; the v1 implementation (ADR-0015) is one revert away if a blocking bug appears.
