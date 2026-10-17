# @usepreface/application

Effect application workflows for Preface instance setup and authenticated sessions. Requires
Node.js 24, Effect v4, and the persistence services from `@usepreface/database`. This private
workspace package coordinates business policy, security capabilities, transactions and audit.
It does not start an HTTP server or read deployment configuration on import.

## Composition

The root exports `Application`, `PasswordService`, `TokenService` and `SecurityError`.
`@usepreface/application/node` supplies `NodePassword.layer` and `NodeToken.layer`.
The latter uses the supplied Effect `Crypto.Crypto`; provide `NodeCrypto.layer` at the runtime edge.

```ts
import { NodeCrypto } from "@effect/platform-node";
import { Effect, Layer } from "effect";

import { Application } from "@usepreface/application";
import { NodePassword, NodeToken } from "@usepreface/application/node";
import {
  Database,
  DatabaseMigration,
  DatabaseRepository,
  TransactionService,
} from "@usepreface/database";

const PersistenceLive = Layer.mergeAll(DatabaseRepository.layer, DatabaseMigration.layer).pipe(
  Layer.provideMerge(TransactionService.layer),
  Layer.provide(Database.layer),
);
const SecurityLive = Layer.mergeAll(NodePassword.layer, NodeToken.layer).pipe(
  Layer.provide(NodeCrypto.layer),
);
const ApplicationLive = Application.layer.pipe(
  Layer.provide(PersistenceLive),
  Layer.provide(SecurityLive),
);

const prepareInstance = Effect.gen(function* () {
  const application = yield* Application;
  return yield* application.instance.bootstrap.prepare();
}).pipe(Effect.provide(ApplicationLive));
```

Supply the database configuration documented in the database package. Application acquisition
requires `DatabaseMigration`, so its workflows cannot be acquired before migrations finish.
A future server must also gate HTTP listeners and workers on migrations and complete startup
preparation before accepting requests. Reuse one composed Layer/runtime across startup and requests.

## Instance setup

`application.instance.bootstrap` exposes:

| Method                | Behavior                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `prepare()`           | Initialize installation/settings; issue a missing or expired proof; preserve an existing valid proof.            |
| `getStatus()`         | Return `{ state: "setup_required" \| "ready", instanceName }`.                                                   |
| `inspectToken(token)` | Check the current redacted proof and return `{ expiresAt }`.                                                     |
| `complete(input)`     | Atomically create the first owner account, password credential, owner grant, session and completed installation. |
| `reissueToken()`      | Explicit operator-only replacement; invalidates the previous proof and refuses completed setup.                  |

`prepare()` returns a discriminated result: `{ state: "ready" }`,
`{ state: "pending", expiresAt }`, or `{ state: "issued", expiresAt, token }`.
Only `issued` contains a raw credential, wrapped in `Redacted`. Replicas serialize on the
installation row; starting another replica does not replace a valid pending proof. Only the
issuing caller receives the credential. A lost startup output requires explicit reissue or expiry;
the stored digest cannot reconstruct it.

The future startup adapter builds the operator URL from its configured public origin and the
issued token after commit, then prints that supported operator output. This package neither builds
nor logs URLs. Keep `reissueToken()` behind an operator command, never a public setup endpoint.
Proof issuance/replacement and its typed system audit event commit together.

Decode incoming completion requests with `CompleteBootstrapInput` from `@usepreface/protocol`.
It trims names, trims/lowercases email without provider-specific rewriting, and wraps the setup
token/password in `Redacted`. Passwords are preserved exactly and require 15–128 JavaScript string
code units, with no composition rules. Encoding these secret input fields back to JSON is forbidden.
Transport must sanitize schema errors instead of logging request bodies or validation issues with secrets.

`complete()` accepts the decoded input and returns `{ actor, sessionToken }`. `actor` contains
only `user: { id, displayName, email, emailVerifiedAt }` and `session: { id, expiresAt }`.
Encode it with the public `SessionActor` schema for ISO timestamp strings. Unwrap `sessionToken`
only at the server cookie boundary; do not return the entire application result as a JSON body.
The account starts with an unverified email: possession of the setup link does not prove mailbox access.

The preliminary proof check happens before password hashing. Hashing and session-secret generation
occur outside SQL transactions. Completion then locks installation, checks the current proof and
fresh expiry again, and writes all state plus owner/session/bootstrap audit records in one transaction.
Failure, including audit failure, rolls everything back. Concurrent completions admit exactly one
owner; consumed, replaced and expired proofs cannot complete setup. Completion never creates an
organization or grants organization access.

`BootstrapError` exposes `INVALID_INPUT`, `INVALID_TOKEN`, `ALREADY_COMPLETED` and
`EMAIL_UNAVAILABLE`. Only the known canonical-email uniqueness violation maps to the latter;
unrelated database failures retain their internal type. HTTP mapping must not expose database causes,
SQL parameters or infrastructure details. Failed completion leaves the proof available until expiry.

## Sessions

`application.auth.session.resolve(token)` accepts a redacted raw session credential and returns a
`SessionActor`. Each call looks up the digest, rejects revoked/absolutely expired sessions, checks
that the user still exists and is enabled, and enforces idle expiry. It does not cache authority.
Routine activity writes are throttled and cannot revive a session that becomes idle-expired between
the initial lookup and the update. Activity never extends absolute expiry.

`revokeCurrent(actor)` revokes the actor's matching session and appends its required audit event
in the same transaction. Repeated calls succeed without another audit row. Only pass actors produced
by authentication; actor identities are not request-body fields. The server clears the cookie after
success. Sensitive future workflows must recheck their own current grants and resource authority;
this actor does not imply instance ownership or organization membership.

Invalid, disabled-user, revoked, idle-expired and absolutely expired sessions produce the same
`AuthenticationError` with `UNAUTHENTICATED`. Operational failures remain distinct from an invalid
credential. Cookie flags, Origin/CSRF policy, rate limiting, request size limits and HTTP status codes
belong to the future server boundary.

## Credential policy

Stable product lifetimes are defined in application code:

| Policy                    | Value      |
| ------------------------- | ---------- |
| Setup proof lifetime      | 30 minutes |
| Session absolute lifetime | 30 days    |
| Session idle timeout      | 7 days     |
| Activity write interval   | 5 minutes  |

`NodeToken` generates 32 random bytes per credential and hashes framed, purpose/version-separated
inputs with SHA-256. Setup verification uses Node's constant-time comparison. Only digests reach
repositories; raw values remain redacted. No secret configuration or recoverable token storage is needed.

`NodePassword` uses `@node-rs/argon2` for encoded Argon2id v1.3 hashes with random salts,
19,456 KiB memory, two passes, one lane and 32-byte output. This focused native dependency avoids
implementing password hashing or its encoded format ourselves. The profile meets the
[OWASP Argon2id baseline](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id).
The shared adapter limits concurrent hash/verify operations to two; transport admission limits
must bound incoming work. Security-provider errors omit secret inputs and native error details.

## Verification and remaining work

```sh
pnpm --filter @usepreface/application typecheck
pnpm --filter @usepreface/application lint
pnpm --filter @usepreface/application test
pnpm --filter @usepreface/application test:built
PREFACE_TEST_POSTGRES_PORT=55439 pnpm --filter @usepreface/application test
```

PGlite tests compose migrated real repositories, real security adapters and a deterministic Effect
clock. Focused scenarios cover restart/reissue/expiry, concurrent completion, proof changes during
hashing, audit rollback, disabled users, session expiry/activity and audited revocation. A password
barrier controls timing at the security boundary; a scoped database trigger simulates audit failure.
The PostgreSQL lane uses the database package's explicit disposable-test configuration and runs files
sequentially. Never point it at an existing development or deployment database. See the database
README for the container command. The built smoke test runs the full setup/session lifecycle against
packaged dependencies and migrations without source conditions.

Application workflows are implemented; Compose startup, operator CLI/log output, API contracts,
HTTP handlers/cookies and onboarding UI integration remain unwired. Sign-in, invitations,
email verification, password reset, organization creation and SSO are subsequent features.
