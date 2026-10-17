# @usepreface/protocol

Shared Effect schemas, domain models, identifiers and expected errors for Preface. This internal
package is runtime-neutral: browser and Node.js consumers use the same public contracts. Keep it free
of Node.js built-ins, DOM-specific APIs, database code and application workflows.

Choose the entry point for the boundary you are working on:

| Import                       | Contents                                                               |
| ---------------------------- | ---------------------------------------------------------------------- |
| `@usepreface/protocol`       | Branded identities, reusable values and expected errors.               |
| `@usepreface/protocol/dto`   | Public request/response schemas, including safe users and sessions.    |
| `@usepreface/protocol/input` | Normalized application inputs with non-encodable redacted credentials. |
| `@usepreface/protocol/model` | Persistence codecs and focused repository write inputs.                |

Existing root DTO/input exports remain available for compatibility. New callers should use the
explicit entry points. Public DTOs reuse identifiers and common schemas without importing storage
models. Storage models contain internal fields such as credential HMACs and token digests and must
never be returned directly from an HTTP handler. Public timestamps encode as ISO strings.

Shared field schemas live in focused `src/common/` modules: display names, canonical
email/input normalization, verification codes, credential digests, secret tokens and
organization permissions/values. Domain identifiers use the shared factory:

```ts
import { createBrandedId } from "@usepreface/protocol";

export const OrganizationDocumentId = createBrandedId("OrganizationDocumentId");
export type OrganizationDocumentId = typeof OrganizationDocumentId.Type;
```

The factory preserves UUIDv7 validation and the distinct literal brand. Existing
`UserEmail`, `UserDisplayName` and `InstanceDisplayName` exports reuse the common
schemas. Organization models and public DTOs cover organization, membership, roles,
grants, access, pagination and the default local-email authentication policy.
`OrganizationError` owns its code/status mapping alongside other protocol errors.

Internal email models define typed `instance-setup`, `sign-in` and
`organization-invitation` payloads plus encrypted outbox lifecycle records. Their
variable schemas are exported for template props. These contracts do not provide
templates, grant access or implement passwordless authentication.

```ts
import { UserId, BootstrapError } from "@usepreface/protocol";
import { CompleteBootstrapRequest, SessionActor } from "@usepreface/protocol/dto";
import { CompleteBootstrapInput } from "@usepreface/protocol/input";
import { User, Session } from "@usepreface/protocol/model";
```

`RequestBootstrapVerificationInput` trims names, trims/lowercases email and redacts
the operator proof. `CompleteBootstrapInput` accepts proof, challenge identity and
an eight-digit code, redacting both credentials. Secret input encoding is forbidden.
`SecretTokenFromString` decodes incoming tokens; `SecretToken` validates redacted tokens.
Keep validation errors containing raw input out of responses/logs. `SessionActor` is constructed
by authentication and must not be accepted as a client-supplied identity. Its only fields are safe
`user` identity/profile and `session` identity/expiry; it contains no credential or authority grant.

`CompleteBootstrapRequest` and `InspectBootstrapRequest` are encodable HTTP wire schemas with
string credentials. They share token validation with application inputs through reusable common schemas;
server handlers immediately decode them into redacted inputs. This distinction lets typed HTTP
clients transmit credentials without making internal secret-input encoding available.
Write-only schema annotations document sensitive request fields. JSON Schema counts Unicode code
points while the existing length policy counts UTF-16 code units; generated bounds are conservative
and descriptions state the exact policy. `RequestError` contains only a closed transport error code.
Bootstrap and request errors define code/status metadata once alongside their schemas. The API
package derives status-specific HTTP schemas from that metadata. Protocol imports no HTTP
implementation. HTTP paths, middleware declarations and error encoding belong to `@usepreface/api`.

Storage codecs decode driver `Date` values into Effect `DateTime.Utc` and encode them back for writes.
Installation, grant, credential and session codecs validate lifecycle consistency. User emails
must already be trimmed and lowercase; ordinary address syntax is validated without rewriting
provider-specific dots or plus tags. Display names are trimmed and 1–120 characters. Session
digests are 64 lowercase hexadecimal characters, representing SHA-256 of a random session secret.
Normalized `User` owns identity, while `UserEmailAddress` owns email verification
and login eligibility. `UserProfile` is a joined repository projection. `Verification`
and `SessionAuthentication` represent single-use proofs and session evidence.
Password storage is absent.

Audit contracts correlate event types with their target identities and metadata. Current events
cover bootstrap proof issuance/replacement, bootstrap completion, owner grants and session
creation/authentication/revocation and email sign-in proof requests/failures. Proof issuance metadata records whether an existing digest was replaced,
without retaining either credential. Verification-request/failure events retain
challenge identity and attempt count, never codes or email payloads. User actors require a user identity; system actors cannot
carry one. Extend the typed union when adding new audited
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
