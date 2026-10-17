# Sessions

Setup creates the initial browser session; [email sign-in](email-sign-in.md) creates
fresh sessions for returning users. [Google sign-in](google.md) also issues sessions for explicitly linked users. Authentication resolves an opaque cookie
credential through the application on every protected request. A successful actor
identifies the current user/session, without asserting instance ownership or future
organization membership. There is no sign-in or session-management UI yet.

## Credential and resolution

The Node token adapter generates 32 random bytes and derives purpose/version-separated
SHA-256 digests. Only digests persist. Setup proofs and session credentials use separate
purposes. No JWT or operator-provided session-signing secret is needed.

Resolution hashes the presented redacted credential, looks up an active session and
loads its current profile and usable authentication evidence. Evidence records
method, email or external-account source, authentication/expiry times, assurance and revocation. Composite
foreign keys bind session and source to the same user. Missing or revoked evidence,
unusable email sources or unlinked/inactive/stale-revision Google sources, missing profile, revoked, absolutely
expired, idle-expired and disabled-user sessions all produce `AuthenticationError` with `UNAUTHENTICATED`.
Storage/security failures remain distinct and must not be treated as invalid login.

| Policy                  | Implemented value |
| ----------------------- | ----------------- |
| Absolute lifetime       | 30 days           |
| Idle timeout            | 7 days            |
| Activity-write interval | 5 minutes         |

Activity writes are throttled and monotonic. Their conditional update rechecks expiry,
revocation and idle eligibility, so a session cannot be revived after becoming invalid
between lookup and activity recording. Activity never extends absolute expiry.
Authority is not cached across requests. Future sensitive workflows must perform
their own fresh grant/resource checks rather than infer permission from this actor.

## HTTP boundary

The `preface_session` cookie is host-only, `HttpOnly`, `SameSite=Lax`, `Path=/` and
expires with the session's absolute expiry. HTTPS `PUBLIC_URL` also enables `Secure`
and HSTS even when an internal reverse-proxy connection uses HTTP. HTTP public
origins are accepted only for loopback development.

Authentication middleware decodes the cookie and resolves the actor before providing
`CurrentActor`. Invalid credentials produce 401 and expire the cookie. The handler
returns only `PublicUser` and `PublicSession`. Mutations require the server's exact
trusted Origin, including requests from non-browser clients. Additional CORS origins
do not change browser SameSite rules.

## Session management and failure

Logout optionally resolves the cookie, revokes a valid matching user/session and
appends `auth.session_revoked` in one transaction. Only after success does the server
expire the cookie. Missing, malformed or already-invalid credentials return 204 and
clear it. Repeated revocation does not append another audit event.

`GET /api/v1/auth/sessions` lists only the actor's unrevoked, unexpired, non-idle
sessions with usable evidence. Pages default to 25 and cap at 100, ordered by UUIDv7
identity descending with an exclusive cursor. Responses expose creation, activity,
expiry and `isCurrent`, never token digests or authentication storage.

`DELETE /api/v1/auth/sessions/:sessionId` revokes only a session belonging to the
actor and clears the cookie when it is current. A missing or other-user ID is a
204 no-op. `DELETE /api/v1/auth/sessions` revokes all the actor's unrevoked sessions,
including the current one. Session issuance and revoke-all serialize on the user
row: issuance committed before revocation is included; a later sign-in can create a
new session. Both operations revoke associated evidence and append per-session
audit in their transaction. Failed audit rolls back all revocations.

An operational failure still fails logout; it must not report successful revocation.
The application accepts actors from authentication, never caller-controlled user or
session IDs in the request body. Account disabling is represented in storage and
checked during resolution, but its management workflow is not implemented.

Application tests cover expiry/activity, disabled users and audited revocation. HTTP
tests cover safe response fields, cookie flags, authenticated lookup, logout and
rejection of the old credential after revocation.

## Source

- [Session workflow](../../packages/application/src/auth/session.ts)
- [Credential policy](../../packages/application/src/security/policy.ts)
- [Token implementation](../../packages/application/src/node/token.ts)
- [Session repository](../../packages/database/src/repositories/auth/session.ts)
- [Authentication middleware](../../apps/server/src/http/middleware/session-authentication.ts)
- [Cookie boundary](../../apps/server/src/http/cookies/session.ts)
- [HTTP lifecycle test](../../apps/server/tests/integration/http/onboarding.test.ts)

## External evidence

[Google identity](google.md) adds account/connection-backed evidence alongside email proofs.
Usable Google evidence requires an active connection at the same revision and a linked account.
Unlink, disable and credential changes invalidate that source. Session resolution requires at
least one usable source; losing Google does not remove independent email evidence. Google
sign-in creates a new Preface session, while explicit linking and Google/email reauthentication
add evidence to the current session without extending its absolute expiry. Organization policy
checks these proofs on every access. Logout also revokes pending authenticated provider flows.
