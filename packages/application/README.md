# @usepreface/application

Effect workflows for Preface instance setup, email sign-in and sessions. Requires Node.js 24,
Effect v4 and workspace database, crypto and email services. This private package
coordinates business policy, transactions and audit without starting a server.

## Composition

Install workspace dependencies with `pnpm install`. Supply `DatabaseRepository`,
`TransactionService`, completed `DatabaseMigration`, `TokenService`, `TokenCrypto`,
`SecretCrypto`, `EmailJobs` and `AuthenticationLinks` to `Application.layer`. Supply platform crypto from
the Node runtime edge. The server's complete composition is in
[its runtime module](../../apps/server/src/runtime.ts).

`@usepreface/application/node` exports `NodeToken.layer`, adapting shared token
primitives while preserving Preface credential formats. Cryptographic operations
belong to `@usepreface/crypto`; durable email intent belongs to `@usepreface/emails`.
Application workflows require neither a delivery provider nor renderer. The server
starts delivery separately, after migrations and startup preparation.
`AuthenticationLinks` supplies the trusted public origin used to build sign-in links.

## Instance setup

```ts
import { Effect } from "effect";

import { Application } from "@usepreface/application";

// Run within the application's configured Effect runtime.
export const prepareInstance = Effect.gen(function* () {
  const application = yield* Application;
  return yield* application.instance.bootstrap.prepare();
});
```

`application.instance.bootstrap` exposes:

| Method                       | Behavior                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `prepare()`                  | Initialize installation/settings, issue a missing/expired proof, preserve a valid pending proof.           |
| `getStatus()`                | Return `{ state: "setup_required" \| "ready", instanceName }`.                                             |
| `inspectToken(token)`        | Check the current redacted operator proof and return its expiry.                                           |
| `requestVerification(input)` | Store pending account details and enqueue a setup code; return challenge identity, expiry and resend time. |
| `resendVerification(input)`  | Replace the current challenge/code after the shared cooldown.                                              |
| `complete(input)`            | Verify code, atomically create verified owner/session and consume setup authority.                         |
| `reissueToken()`             | Operator-only proof replacement; cancel pending challenge/email; refuse completed setup.                   |

Preparation returns `{ state: "ready" }`, `{ state: "pending", expiresAt }`, or
`{ state: "issued", expiresAt, token }`. Only issuance returns the raw redacted proof.
Replicas serialize on installation; restart cannot reconstruct a pending credential.
A lost startup link requires explicit reissue or expiry. The server builds/prints the
operator URL after commit. Keep replacement behind the local CLI, not a public API.

Decode wire requests through `RequestBootstrapVerificationInput`,
`ResendBootstrapVerificationInput` and `CompleteBootstrapInput` from
`@usepreface/protocol/input`. Names trim, email trims/lowercases, and credentials
become non-encodable `Redacted` values. Sanitize validation failures at transport.

Request accepts `{ token, instanceName, ownerName, email }`. It creates no user/session.
Its challenge, encrypted email job and audit event commit together. The returned
`{ challengeId, expiresAt, resendAt }` contains no code. Verification codes have eight
digits, ten-minute expiry bounded by the operator proof, a one-minute resend cooldown
and five durable attempts. The code HMAC includes challenge identity and uses the
shared independent HMAC key. Replacement invalidates prior code identity. Wrong-code
attempts and failure audit commit before returning `INVALID_CODE`.

Completion accepts `{ token, challengeId, code }` and returns `{ actor, sessionToken }`.
The transaction locks installation, rechecks proof and code, writes the verified user,
verified primary email, owner grant, display name, session, authentication evidence and required audit, then consumes both credentials.
No password credential is created. Audit failure rolls back the entire operation;
concurrent completion admits one winner. Final consumption rechecks expiry.
Completion creates no organization or organization access.

Encode `actor` with `SessionActor` from `@usepreface/protocol/dto` for ISO timestamps.
It contains only safe user/profile and session identity/expiry. Unwrap `sessionToken`
only at the server cookie boundary; never serialize the entire application result.

`BootstrapError` has `INVALID_INPUT`, `INVALID_TOKEN`, `INVALID_CODE`,
`VERIFICATION_RATE_LIMITED`, `ALREADY_COMPLETED` and `EMAIL_UNAVAILABLE`.
Only the canonical email uniqueness violation maps to `EMAIL_UNAVAILABLE`.
Infrastructure failures remain distinct and must not expose SQL or secret inputs.
A lost successful completion response cannot be replayed for another session.

## Email sign-in

`application.auth.emailSignIn` exposes `request(input)`, `resend(input)` and `verify(input)`.
Decode their inputs with the matching schemas from `@usepreface/protocol/input`.
Request accepts normalized email; resend requires challenge identity and redacted browser token.
Both return `{ challenge: { challengeId, expiresAt }, browserToken }`; the server delivers
`browserToken` only as an HttpOnly temporary cookie. No code or link is returned publicly.

Existing enabled users with a verified, active, login-enabled address receive an encrypted
sign-in email containing an eight-digit code and a trusted fragment link. Unknown/unusable
addresses receive a decoy challenge and no email; sign-in never enrolls a new user. A returning
operator keeps the same identity/ownership after session expiry, even with no organization.

Verification accepts `{ challengeId, browserToken, method: "code", code }` or
`{ challengeId, browserToken, method: "magic_link", token }`, with redacted credentials.
Proofs last ten minutes, allow five failed attempts and are single-use across both methods.
Replacement invalidates the prior proof and email intent. Sign-in has no resend cooldown.
Fresh account/source checks, session/evidence creation, proof consumption and required audit
share a transaction. Wrong-credential attempts commit before the public failure.
Success returns `{ actor, sessionToken }` for cookie delivery only.

`EmailSignInError` codes are `INVALID_INPUT`, `INVALID_PROOF`, `INSTANCE_NOT_READY` and
`ALREADY_AUTHENTICATED` (the server rejects sign-in from a valid authenticated browser).
Storage and crypto failures remain operational failures. The future frontend must consume the
fragment at `/auth/email/verify`; the backend does not render that page.

## Sessions

`application.auth.session.resolve(token)` accepts a redacted credential and returns
`SessionActor`. It freshly checks digest, revocation, absolute/idle expiry and user
usability, usable authentication evidence and its current email source. Throttled activity writes cannot revive idle-expired sessions or extend
absolute expiry. Invalid credentials produce `AuthenticationError/UNAUTHENTICATED`;
operational failures retain their type.

`revokeCurrent(actor)` revokes the actor's matching session and writes its audit event
atomically. Repeated calls succeed without another event. Supply authenticated actors,
never request-body identities. The server clears the cookie after success.

`list(actor, { cursor?, limit? })` returns safe active-session pages (25 by default, maximum 100).
`revoke(actor, sessionId)` is scoped to the actor's user. `revokeAll(actor)` revokes sessions and
their evidence with required per-session audit. Issuance and revoke-all share a user-row lock.
Sessions alone imply neither instance ownership nor organization membership.

## Credential policy

| Policy                    | Value                                       |
| ------------------------- | ------------------------------------------- |
| Operator proof            | 30 minutes                                  |
| Setup code                | 10 minutes, bounded by proof expiry         |
| Email sign-in proof       | 10 minutes; code and link share consumption |
| Setup resend cooldown     | 1 minute                                    |
| Code attempt budget       | 5 per challenge                             |
| Session absolute lifetime | 30 days                                     |
| Session idle timeout      | 7 days                                      |
| Activity write interval   | 5 minutes                                   |

Opaque tokens use 32 random bytes and purpose-separated SHA-256 digests. Shared crypto
owns secure randomness, constant-time verification, HMAC and encryption. Keep its two
independent keys stable across replicas/restarts and back them up with the database.

## Verification

```sh
pnpm --filter @usepreface/application typecheck
pnpm --filter @usepreface/application lint
pnpm --filter @usepreface/application test
pnpm --filter @usepreface/application test:built
PREFACE_TEST_POSTGRES_PORT=55439 pnpm --filter @usepreface/application test
```

Tests compose real repositories, crypto, encrypted email intent and deterministic clocks.
They cover proof/code replacement, expiry, concurrent completion/attempts, audit rollback
and session lifecycle. The explicit PostgreSQL lane uses disposable test configuration
and sequential files; never target a deployment database. Built tests exercise packaged
migrations and the verification/session lifecycle.

Onboarding/sign-in UI, account recovery, invitations, organization creation
and SSO are not implemented. See the [instance setup architecture](../../architecture/identity-access/instance-setup.md)
and [server README](../../apps/server/README.md) for current transport and deployment.
