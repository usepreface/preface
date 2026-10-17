# Shared contracts

`packages/protocol` owns runtime schemas and derived TypeScript types. `packages/api`
combines them into the Effect HTTP contract consumed by server handlers and typed
clients. Requests, responses and errors have one schema definition for that boundary.

## Protocol modules

| Module         | Responsibility                                                                             | Public entry point                        |
| -------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `identifiers/` | Branded UUIDv7 installation, user, session, owner-grant and audit identities               | Protocol root                             |
| `common/`      | Reusable field schemas, input normalization, credential codecs and branded-ID construction | Protocol root for supported shared values |
| `errors/`      | Expected failures grouped by domain, with safe public fields                               | Protocol root                             |
| `dto/`         | Public requests and explicitly selected responses                                          | `@usepreface/protocol/dto`                |
| `input/`       | Normalized application inputs with redacted credentials                                    | `@usepreface/protocol/input`              |
| `model/`       | Persistence codecs and repository write inputs                                             | `@usepreface/protocol/model`              |

Purpose is the first folder boundary; domains and workflows sit inside it. An
operation's request and response stay together when that is readable. Subdivide
large domains by workflow rather than creating an unrelated folder for each schema.
Barrels expose supported boundaries, not every implementation file.

Existing root DTO/input exports remain compatible, but current consumers use the
explicit subpaths. Shared field schemas retained by the model export also remain
available for compatibility. UUIDv7 identifiers use the shared `createBrandedId` factory. Common display-name,
email, verification-code, digest and credential schemas live in focused `common/`
modules; input normalization reuses them. DTOs import identifiers and common schemas, never
persistence models. Do not add speculative organization or provider modules before
their workflows need contracts.

## Wire, application and persistence values

`RequestBootstrapVerificationRequest` encodes the operator proof and account details.
Its application input trims names, canonicalizes email and redacts the proof.
`CompleteBootstrapRequest` carries proof, challenge ID and eight-digit code;
`CompleteBootstrapInput` redacts both credentials. Encoding those internal
credentials is forbidden. Public DTOs and application inputs share value validation
without importing each other's implementation.

Names require 1–120 UTF-16 code units after trimming. Email canonicalization
trims and lowercases the whole address without provider-specific rewriting. JSON
Schema counts Unicode code points, so its generated length bounds are conservative;
field descriptions state the server's exact rule.

Storage codecs translate driver `Date` values to Effect `DateTime.Utc` and back.
Public DTOs translate timestamps to ISO strings. Use the owning schema to encode
values; serializing arbitrary decoded objects does not establish the wire contract.
`SessionActor` includes only safe user/profile and session identity/expiry fields.
Verification HMACs, token digests and instance-owner storage fields are absent.

## Errors and HTTP declarations

Email sign-in DTOs carry email, challenge identity and a code/link discriminated
payload. Browser binding is supplied by the server cookie, not the public JSON
body. Internal inputs redact credentials and forbid their encoding. Storage separates
`User`, `UserEmailAddress`, `Verification` and `SessionAuthentication`; `UserProfile`
is a joined repository projection rather than another email authority.

Expected failures use `Schema.TaggedError`. Bootstrap, email sign-in and request errors define
their code/status mapping once alongside the protocol error. Allowed codes are
derived from that mapping; the API creates narrowed schema variants with the
corresponding static HTTP status. Protocol stores plain metadata and imports no
HTTP implementation. These variants decode into tagged objects; callers should
discriminate `_tag` and `code` rather than assume a client-side error class instance.

The HTTP API owns paths, methods, status-specific encoding, middleware requirements
and OpenAPI annotations. It contains no handlers or queries. `CurrentActor` is
provided by authentication; it is never a request-body identity. Setup protection
is attached to matched endpoint identifiers before payload decoding.

`PrefaceApi` is prefixed with `/api/v1`. A typed client's base URL is the origin,
without another API prefix. Cookie authentication is declared in the contract;
the server owns cookie flags, exact-Origin policy and revocation enforcement.
Health checks and the local operator CLI are outside product OpenAPI.

## Build and verification

The package is runtime-neutral and depends only on Effect. Source development uses
`preface-source`; default exports use unbundled ESM artifacts. Root, DTO, input and
model entry points are built explicitly and retain their declared export paths.

Contract tests verify generated paths/security/statuses and the encodable-wire versus
non-encodable-input distinction. HTTP tests exercise those contracts through real
application and persistence code. Schema validation alone does not establish authority.

## Source

- [Protocol manifest](../../packages/protocol/package.json)
- [Bootstrap DTOs](../../packages/protocol/src/dto/instance/bootstrap.ts)
- [Bootstrap input](../../packages/protocol/src/input/instance/bootstrap.ts)
- [Bootstrap error metadata](../../packages/protocol/src/errors/instance/bootstrap.ts)
- [HTTP error variants](../../packages/api/src/http-errors.ts)
- [Contract tests](../../packages/api/tests/contracts/openapi.test.ts)
