# @usepreface/protocol

Shared Effect schemas, domain models, identifiers and expected errors for Preface. This internal
package is runtime-neutral: browser and Node.js consumers use the same public contracts. Keep it free
of Node.js built-ins, DOM-specific APIs, database code and application workflows.

The root exports branded UUIDv7 identities and expected instance-state errors. The explicit
`@usepreface/protocol/model` entry exports instance, user, password-credential, session and audit
storage codecs and focused write inputs. These models contain internal fields such as password
hashes and setup/session-token digests; they are
not public response DTOs. Public responses must explicitly select safe fields when APIs are added.

Storage codecs decode driver `Date` values into Effect `DateTime.Utc` and encode them back for writes.
Installation, grant, credential and session codecs validate lifecycle consistency. User emails
must already be trimmed and lowercase; ordinary address syntax is validated without rewriting
provider-specific dots or plus tags. Display names are trimmed and 1–120 characters. Session
digests are 64 lowercase hexadecimal characters, representing SHA-256 of a random session secret.
Credential hashes remain opaque nonempty encoded strings; the future credential service owns
password hashing and algorithm validation.

Audit contracts correlate event types with their target identities and metadata. Current events
cover bootstrap completion, owner grants and session creation/revocation. User actors require a
user identity; system actors cannot carry one. Extend the typed union when adding new audited
workflows. These persistence contracts do not implement authentication, hashing or HTTP APIs.

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
