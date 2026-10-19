# Instance setup

Startup initializes one installation and its settings, then issues a 30-minute
operator proof. Its link is printed only after commit. Setup creates a verified
first owner and a session; it creates the sole organization.

## Operator proof

Preparation initializes storage idempotently and locks installation. A valid pending
proof survives restarts and additional replicas. Only the issuing caller receives
the raw redacted credential; storage contains a purpose-separated digest.
Expired/missing proofs are replaced by ordinary preparation. Explicit local
`preface instance setup-link reissue` replaces any pending proof and refuses a
completed installation. Issuance and its required audit event share one transaction.

The server prints `PUBLIC_URL/setup#token=…`. The fragment stays outside HTTP
request paths. `/setup` is reserved for onboarding UI and is not served yet.
Protect operator logs and access to the container. Proof replacement cancels the
pending email job and deletes its challenge in the same transaction. An already
in-flight message cannot be recalled, but its code is no longer eligible.

## Request and resend

`POST /api/v1/instance/setup` accepts the proof, organization name, owner name and email.
Application inputs trim names and trim/lowercase email. Inspection checks the proof
without consuming it. Code generation happens outside SQL locks.

The request transaction locks installation, rechecks the proof, replaces the single
pending `instance.bootstrap_challenge`, enqueues an encrypted `instance-setup` email
and appends `instance.bootstrap_verification_requested`. It creates no user or session.
A required audit failure rolls back both challenge and email intent. No provider
call occurs inside the business transaction.

The response is 202 with `{ challengeId, expiresAt, resendAt }`. It contains neither
code nor email payload. The eight-digit code expires after ten minutes, bounded by
the operator proof's expiry. Storage holds a purpose-separated HMAC over challenge
identity and code, using an independent deployment key. A database reader cannot
offline-guess the code from this HMAC alone.

`POST /api/v1/instance/setup/resend` accepts proof and current challenge ID. A shared
one-minute database cooldown applies to both resend and new-details requests. A
replacement changes challenge identity and cancels the previous queued job. HTTP
returns 429 with `Retry-After` during cooldown. Codes work on local/internal hosts
without an externally reachable callback or magic-link origin.

## Verification and completion

Verification locks the installation and checks the current setup proof, challenge,
expiry and durable attempt budget. An incorrect code commits its failed attempt and
audit before returning the error. Expired/replaced proofs cannot complete setup.

Success writes the verified user and primary email, instance-owner grant, sole
organization, owner membership/binding, built-in organization and team roles,
default authentication policy, session and authentication evidence. It consumes
setup authority, cancels delivery and appends required audit rows in that same
transaction. Bootstrap marks completion only after initialization succeeds.
Any failure rolls back every completion write; the pending proof remains retryable
within its deadline. Concurrent completion produces one installation organization.

The public request uses `organizationName`, `ownerName` and `email`. The organization
metadata owns its display name after setup; there is no subsequent organization
creation screen. The transport returns the safe actor and delivers the opaque session
credential only in the HttpOnly cookie. Organization-specific proof and authority
are not inferred from the cookie alone.

## Recovery and limits

Email acceptance is asynchronous and does not guarantee inbox delivery. The operator
can resend after cooldown or replace a lost setup proof locally. Restart does not
extend proof/code expiry. A lost successful completion response cannot be replayed
to obtain another session. Use [email sign-in](email-sign-in.md) to obtain a fresh
session for the same owner, including after a week away.
The dashboard completes these two setup screens and opens the organization directly.
Google and enterprise SSO are configured afterward through organization settings.

Application regressions cover replacement, expiry, concurrent failure/completion,
failed-attempt durability and audit rollback. Built PostgreSQL tests exercise startup,
operator replacement, restart, real worker output and verification before cookies.

## Source

- [Workflow](../../packages/application/src/instance/bootstrap.ts)
- [Challenge repository](../../packages/database/src/repositories/instance/bootstrap-challenge.ts)
- [Email delivery](../integrations/email.md)
- [Startup](../../apps/server/src/startup.ts)
- [HTTP handlers](../../apps/server/src/http/routes/instance/setup.ts)
- [Application regressions](../../packages/application/tests/integration/instance)
- [Built process tests](../../apps/server/tests/smoke/built.test.mjs)
