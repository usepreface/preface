# Email sign-in

An existing enabled user can sign in with an eight-digit email code or a magic
link. Ordinary sign-in creates no account, owner grant or organization membership.
After setup, an operator whose session expires can authenticate the same identity
and retain instance ownership even if no organization has been created.

## Proof issuance and replacement

`POST /api/v1/auth/email/request` accepts an email address. Application input trims
and lowercases it without rewriting provider-specific dots or plus tags. A usable
source is an active, verified, login-enabled `auth.user_email` belonging to an
enabled user. Unknown and unusable recipients receive the same public
`{ challengeId, expiresAt }` response, with a browser-bound decoy proof and no email.
This equalizes response contents, not execution time. There is no public signup.

Issuance generates a UUIDv7 challenge, random code, random link credential and an
independent random browser credential. The recipient and code use purpose-separated
HMACs; code input includes challenge identity. Link and browser credentials use
separate SHA-256 purposes. Raw credentials persist only inside the encrypted email
payload when delivery requires them. Public responses never contain credentials.

In one transaction, issuance revokes the previous pending proof for that recipient,
cancels its email intent, creates the new proof and encrypted email job, and appends
`auth.email_sign_in_requested`. A partial unique index admits one pending proof per
purpose/recipient HMAC. Competing issuance retries only that known uniqueness race,
up to three retries. No other storage failures are retried automatically.

`POST /api/v1/auth/email/resend` requires the challenge and its browser cookie. It
replaces an unexpired, unconsumed, unrevoked proof and rotates the browser binding.
It cannot recover a lost browser binding or reuse a completed proof; start another
request instead. Sign-in adds no cooldown or database rate-limit table. The server's
existing general request policy still applies.

## Completion and browser boundary

The `preface_sign_in` cookie is host-only, HttpOnly, SameSite=Lax and expires with
the ten-minute proof. It uses Secure for HTTPS public origins. Both code and link
completion require this binding. Opening the email on another device requires
entering its code in the browser that requested sign-in.

Links use the configured trusted `DASHBOARD_URL` origin, falling back to `PUBLIC_URL`, and put challenge identity and
credential in `/auth/email/verify#challengeId=…&token=…`. The server does not render
this frontend route. A future client must read the fragment and explicitly POST
completion; a GET never consumes a proof, and a request cannot supply a redirect URL.
The operational email renderer supplies both code and link for that client.

`POST /api/v1/auth/email/verify` accepts a discriminated code or magic-link payload.
It locks the proof, checks the browser binding and fresh expiry, verifies the
credential, then locks the user and rechecks account/email usability and recipient
binding. Five failed credentials exhaust the shared durable attempt budget. Failure
updates and `auth.email_sign_in_failed` commit before returning `INVALID_PROOF`.
An incorrect browser binding does not spend that budget.

Successful completion creates a fresh session, its email authentication evidence
and required audit, consumes the proof and cancels remaining email intent in one
transaction. Final consumption rechecks expiry. Audit failure rolls back the entire
completion. Concurrent code/link attempts have one winner. A lost success response
requires a new sign-in request; replay cannot recover the credential.

The server rejects ordinary sign-in from an already authenticated browser, writes
only the session cookie, clears the temporary cookie and returns the safe actor.
Exact-Origin and JSON request policy applies. Expected proof failures contain no
recipient, credential, SQL or validation details. See [sessions](sessions.md) for
resolution and revocation.

## Retention and limits

A scoped server task deletes proofs whose expiry is at least one day old, in batches
of 500 using `FOR UPDATE SKIP LOCKED`. It runs after migration/startup preparation,
waits one second between full batches and one hour otherwise, and stops with the
server scope. Required audit history is independent and survives proof deletion.
Email expiry and terminal payload removal belong to the email worker. Cleanup
failure logs a bounded message and retries next cycle; it does not alter proof
validity checks.

Additional-address management and sign-in UI remain pending. [Google](google.md) and
[enterprise SSO](oidc.md) use separate provider flows. Sign-in adds no distributed request throttling.

## Verification and source

PGlite and disposable PostgreSQL tests compose real workflows, repositories, crypto
and encrypted email intent. They cover an idle returning operator, proof replacement,
wrong browser binding, concurrent code/link consumption, competing failed guesses,
expiry, unavailable sources and required-audit rollback. HTTP tests exercise the
typed contract, cookie delivery, replay rejection and session management.

- [Application workflow](../../packages/application/src/auth/email-sign-in.ts)
- [Verification repository](../../packages/database/src/repositories/auth/verification.ts)
- [Verification schema](../../packages/database/src/schema/auth/verification.ts)
- [HTTP routes](../../apps/server/src/http/routes/auth/email-sign-in.ts)
- [Operational renderer](../../packages/emails/src/rendering/authentication.ts)
- [Cleanup task](../../apps/server/src/authentication-maintenance.ts)
- [Application tests](../../packages/application/tests/integration/auth/email-sign-in.test.ts)
