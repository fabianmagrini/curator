# 0010. Run the gateway dev server from compiled output, not tsx

- Date: 2026-06-28
- Status: Accepted

## Context

NestJS resolves constructor dependencies by reading the parameter type metadata that
TypeScript emits when `emitDecoratorMetadata` is on. The gateway's dev script originally used
**tsx** (esbuild) for fast watch/reload, but esbuild does not emit decorator metadata. Under
tsx, Nest's DI silently failed at runtime — `this.aguiService` was `undefined` and every
`/agui/stream` request threw `Cannot read properties of undefined (reading 'streamRun')`. It
went unnoticed because all earlier smoke tests ran the **tsc-compiled** `dist`
(`node dist/main.js`), which does emit the metadata.

## Decision

Run the gateway dev server from **tsc-compiled output**, which preserves decorator metadata,
with watch + restart: `tsc -p tsconfig.json -w` alongside `node --watch dist/main.js`, run
together via `concurrently`. The `tsx` dependency is removed.

Alternatives rejected: tsx/esbuild (the root cause — no `emitDecoratorMetadata`); SWC
(supports metadata but adds another toolchain); `@nestjs/cli` `nest start --watch` (canonical,
but a heavy dependency and uncertain fit with our NodeNext/ESM tsconfig — reusing the exact
`tsc` + `node` invocations that already work in `build`/`start` is more predictable).

## Consequences

- Gateway dev behaves like production (same compiled output), so DI and decorator-dependent
  features can't pass in dev while failing when built.
- Dev startup is a touch slower than esbuild and uses two watch processes instead of one.
- Any future Nest dev tooling must preserve `emitDecoratorMetadata`; this constraint applies
  to the whole gateway ([ADR-0009](0009-nestjs-for-the-gateway.md)).
