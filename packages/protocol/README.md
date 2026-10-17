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
organization permissions/values. Versioned presentation schemas live in `src/metadata/`: user
name/title/bio/image and organization/team name/description/logo. Stored metadata includes
`version: 1`; public patch inputs omit the version. Optional image/logo values describe
`{ type: "image", value: "https://…" }` only; upload and image editing APIs are not provided.
Domain identifiers use the shared factory:

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
`organization-invitation`, `invitation-verification` and `email-reauthentication` payloads plus encrypted outbox lifecycle records. Their
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
Password storage is absent. Invitation verification is a distinct proof purpose with
invitation context and no pre-existing identity source. Invitation models include
recipient, inviter, digest, email job and terminal state; public DTOs omit storage credentials.
Invitation inputs normalize email/display names and redact invitation/proof tokens.

Audit contracts correlate event types with their target identities and metadata. Current events
cover bootstrap proof issuance/replacement, bootstrap completion, owner grants and session
creation/authentication/revocation and email sign-in proof requests/failures. Proof issuance metadata records whether an existing digest was replaced,
without retaining either credential. Verification-request/failure events retain
challenge identity and attempt count, never codes or email payloads. User actors require a user identity; system actors cannot
carry one. Extend the typed union when adding new audited
workflows. These persistence contracts do not implement authentication, hashing or HTTP APIs.

Effect is the only runtime dependency. The neutral production TypeScript preset uses `types: []`
to avoid implicitly loading ambient Node.js types; Node types are enabled only for the test/tooling lane.

## External identity contracts

Identity connection, account and auth-flow IDs are UUIDv7 brands. Storage models distinguish
historical provider bindings from temporary browser transactions. Session evidence has separate
email, Google, OIDC and SAML variants with source-specific references. `email_reauthentication` verification
is bound to an existing user/address/session; it cannot be consumed as ordinary sign-in.

The DTO entry exports safe Google configuration, connected-account summaries and method
availability; secrets and tokens stay in redacted input/storage boundaries. `IdentityError` owns
safe code/status metadata. Google configuration is versioned, and authentication return paths
currently permit only `/api/docs`. Organization OIDC configuration/flow/evidence variants and policy connection models extend these
contracts. `CreateOidcConnectionInput`/`UpdateOidcConnectionInput` redact credentials; safe DTOs never
contain stored secrets. Common external-flow exports retain Google compatibility. The schemas
alone grant no membership or provider support; application implements optional/required OIDC and SAML SSO
and owner recovery. SAML adds safe connection configuration, form callback/completion contracts and
redacted verification inputs. Staged identities and signing private keys remain storage-only.

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

Required-SSO contracts add policy mode/maximum age, provider authentication timestamps, persisted
flow age requirements, readiness and member next actions. `UpdateOrganizationAuthPolicyInput` and
`RecoverOrganizationAuthInput` redact recovery credentials. Rotation has a distinct one-time public
response; ordinary recovery status and policy DTOs contain no secret. Typed `organization-security`
email payloads and recovery audit variants contain only fixed actions, identifiers and safe context.
