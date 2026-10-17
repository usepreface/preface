# Instance setup

Startup initializes one installation and its settings, then issues a 30-minute
operator proof. Its link is printed only after commit. Setup creates a verified
first owner and a session; it creates no organization.

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

`POST /api/v1/instance/setup` accepts the proof, instance name, owner name and email.
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

`POST /api/v1/instance/setup/verify` accepts proof, challenge ID and code. Completion
locks installation and checks the current proof, challenge binding, fresh expiry
and five-attempt budget before constant-time HMAC verification.

A wrong code increments the durable attempt count and writes
`instance.bootstrap_verification_failed`. The transaction returns a marker so these
writes commit before `INVALID_CODE` is returned. The fifth failure cancels pending
email delivery. The correct code is also refused once this budget is exhausted;
after cooldown the operator can request another code. Attempt enforcement is shared
across replicas, independently of process-local HTTP admission limits.

Successful verification writes the user, verified login-enabled primary email, bootstrap owner grant,
instance display name and initial session. It consumes the challenge and operator
proof, and appends owner-granted, email-verified, session-created/authenticated and bootstrap-completed
audit rows in the same transaction, including email authentication evidence. No
password storage exists in the fresh initial schema.

Final conditional consumption rechecks fresh expiry. Audit or storage failure rolls
back all completion writes, including challenge consumption and email cancellation.
Concurrent completions admit one winner. Only the canonical email uniqueness
violation becomes `EMAIL_UNAVAILABLE`; other storage failures remain operational.
After commit, the server returns 201 with the safe actor and session cookie.
See [sessions](sessions.md) for cookie and authority boundaries.

## Recovery and limits

Email acceptance is asynchronous and does not guarantee inbox delivery. The operator
can resend after cooldown or replace a lost setup proof locally. Restart does not
extend proof/code expiry. A lost successful completion response cannot be replayed
to obtain another session. Use [email sign-in](email-sign-in.md) to obtain a fresh
session for the same owner, including after a week with no organization.
No organization, SSO or onboarding UI is implied by this flow.

Application regressions cover replacement, expiry, concurrent failure/completion,
failed-attempt durability and audit rollback. Built PostgreSQL tests exercise startup,
operator replacement, restart, real worker output and verification before cookies.

## Source

- [Workflow](../../packages/application/src/instance/bootstrap.ts)
- [Challenge repository](../../packages/database/src/repositories/instance/bootstrap-challenge.ts)
- [Email delivery](../integrations/email.md)
- [Startup](../../apps/server/src/startup.ts)
- [HTTP handlers](../../apps/server/src/http/routes/instance-setup.ts)
- [Application regressions](../../packages/application/tests/integration/instance)
- [Built process tests](../../apps/server/tests/smoke/built.test.mjs)
