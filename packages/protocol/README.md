# @usepreface/protocol

Shared Effect schemas, domain models, identifiers and expected errors for Preface. This internal
package is runtime-neutral: browser and Node.js consumers use the same public contracts. Keep it free
of Node.js built-ins, DOM-specific APIs, database code and application workflows.

The package is scaffolded with a placeholder export; domain contracts will be added with their owning
features. Effect is a runtime dependency. The neutral Klarity TypeScript preset uses `types: []` to
avoid implicitly loading ambient Node.js types from the workspace.

## Development

From the repository root:

```sh
pnpm --filter @usepreface/protocol typecheck
pnpm --filter @usepreface/protocol lint
pnpm --filter @usepreface/protocol build
pnpm --filter @usepreface/protocol dev
```

Consumers enable `preface-source` in TypeScript and their runtime or bundler to resolve `src/` during
development. Default exports resolve to `dist/`. The neutral, unbundled tsdown build emits ESM,
declarations and maps; watch mode rebuilds these outputs. Use `#/*` for internal imports and explicit
public entry points for workspace consumers. See the [template](../template/README.md) for export and
packing conventions.
