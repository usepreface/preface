# @usepreface/protocol

Shared Effect schemas, domain models, identifiers and expected errors for Preface. This internal
package is runtime-neutral: browser and Node.js consumers use the same public contracts. Keep it free
of Node.js built-ins, DOM-specific APIs, database code and application workflows.

The root exports branded UUIDv7 identities and expected instance-state errors. The explicit
`@usepreface/protocol/model` entry exports installation, settings and owner-grant storage codecs and
focused write inputs. These models contain internal fields such as setup-token digests; they are
not public response DTOs. Public responses must explicitly select safe fields when APIs are added.

Storage codecs decode driver `Date` values into Effect `DateTime.Utc` and encode them back for writes.
Installation and grant codecs validate lifecycle consistency. The `UserId` identifier anticipates
the future auth model; this package does not implement users or authentication.

Effect is the only runtime dependency. The neutral production TypeScript preset uses `types: []`
to avoid implicitly loading ambient Node.js types; Node types are enabled only for the test/tooling lane.

## Development

From the repository root:

```sh
pnpm --filter @usepreface/protocol typecheck
pnpm --filter @usepreface/protocol lint
pnpm --filter @usepreface/protocol build
pnpm --filter @usepreface/protocol test
pnpm --filter @usepreface/protocol dev
```

Consumers enable `preface-source` in TypeScript and their runtime or bundler to resolve `src/` during
development. Default exports resolve to `dist/`. The neutral, unbundled tsdown build emits ESM,
declarations and maps; watch mode rebuilds these outputs. Use `#/*` for internal imports and explicit
public entry points for workspace consumers. See the [template](../template/README.md) for export and
packing conventions.
