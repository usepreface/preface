# Outbound email

`packages/emails` owns typed enqueueing, encrypted outbox payloads, delivery policy
and provider adapters. Application workflows own credentials, recipients, trusted
links and business authority. The database package owns the `jobs.email` table,
claims and conditional state changes. Email payload schemas are internal models
in protocol, not public HTTP DTOs.

The package is implemented independently of server acquisition. There are no
React Email templates, renderer implementation, email-triggering application flows
or running server worker yet. Existing bootstrap/password behavior is unchanged.
`EmailRenderer` is an explicit required capability; absence does not render a
placeholder email or silently mark an email sent.

## Transaction and storage boundary

Workflows call `EmailJobs.enqueue` inside the same transaction as their challenge
or invitation and required audit events. It validates/encodes the discriminated
payload, encrypts it with AES-256-GCM and persists it through the ambient repository
transaction. Enqueue depends on neither delivery configuration nor rendering.
No provider call or detached request-local fiber substitutes for durable intent.

The business idempotency key identifies one logical email. Repetition preserves
the original row; a different payload or expiry fails instead of replacing it.
A keyed, purpose-separated fingerprint detects conflicts without making short
verification codes vulnerable to guessing from a database digest alone. The
recoverable ciphertext contains recipient and template variables; authentication
workflows must separately store their verification digests/HMACs.

The encryption key belongs to deployment secrets. There is no key-ring/rotation
workflow; retain the configured key with database backups. Terminal transitions
clear ciphertext. Rows retain safe metadata and fingerprints; retention deletion
is not implemented.

## Delivery lifecycle

`EmailDelivery.processOnce` requires completed migrations and rejects execution
inside a SQL transaction. It claims at most one eligible job under a short
transaction using `FOR UPDATE SKIP LOCKED`, increments attempts and assigns a
30-second token-owned lease. Workers never hold SQL locks during rendering or sends.

The worker decrypts/decodes the payload, checks expiry, and calls `EmailService`.
The service renders through `EmailRenderer`, applies configured sender/reply-to,
rechecks the effective deadline and sends through `EmailProvider`. The complete
render/send operation has a ten-second deadline. Subjects, HTML and plain text
come from the renderer, never application-provided overrides.

Success, rescheduling and terminal updates require the current unexpired lease.
A stale sender cannot overwrite a replacement claim or cancellation. Cancellation
can stop queued work but cannot recall a provider call already in flight; credential
revocation is enforced separately by the workflow accepting the credential.

Known retryable failures use capped exponential backoff and at most five attempts.
Neither retrying nor restarting extends expiry. Abandoned final attempts terminate
instead of dispatching a sixth send. Invalid ciphertext/payloads terminate safely.
Fresh expiry prevents sending obsolete codes; terminal payloads are removed.

## Provider semantics and runtime

Resend, Inbound, SES v2 and SMTP use `resend`, `inboundemail`,
`@aws-sdk/client-sesv2` and `nodemailer`, respectively. Adapters return provider
acceptance/message identity and sanitize expected failures. They do not promise
inbox delivery. Inbound/AWS automatic retries are disabled so the outbox owns the
attempt budget. Resend, Inbound and SES requests receive interruption signals.
SMTP has bounded connection/socket inactivity timeouts; Nodemailer does not expose
equivalent cancellation of an active send. It may finish after the Effect deadline,
so timeout is an uncertain outcome and is not automatically replayed.

The job UUID is a stable external idempotency key. Only Resend replay is currently
treated as protected, within its documented 24-hour retention; abandoned retry
work older than one hour terminates conservatively. Other uncertain outcomes and
abandoned non-idempotent sends become terminal `UNKNOWN_OUTCOME`. Provider identity
is pinned at first claim, preventing a configuration change from silently failing
over uncertain work. Exactly-once delivery and automatic failover are not promised.

`ConfiguredEmailProvider` selects a Layer once through Effect Config. Only its
provider-specific credentials are required. SES uses the AWS default credential
chain. Console output is explicit development behavior: the selector additionally
requires `NODE_ENV=development`, and the adapter logs plain-text codes/links.
Production uses a real provider and `NODE_ENV=production`; SDK diagnostics must not
be treated as sanitized application logs. Capturing tests replace external delivery.

`EmailWorkerLayer` scopes a sequential loop to its runtime and backs off after
expected infrastructure failures. Unexpected defects are not swallowed. Future
server composition must supply the actual renderer, reuse shared Layers and start
the worker behind the migration gate. Detailed variables and commands belong in
the [package README](../../packages/emails/README.md).

## Verification and limits

Tests compose migrated PGlite/explicit disposable PostgreSQL, real repositories,
encryption, deterministic clocks, a test-only renderer and captured providers.
They cover transactional rollback, conflict detection, delivery/retry/expiry,
cancellation, ciphertext tampering, reclaimed/stale leases and final-attempt
recovery. A PostgreSQL-only regression checks concurrent claim exclusion. SDK
boundary tests intercept requests without sending email.

No template preview, auth email API, resend endpoint, provider webhook,
reconciliation workflow or delivery-management UI exists yet. Payload contracts
alone do not implement passwordless authentication or invitations.

## Source

- [Payload contracts](../../packages/protocol/src/model/email/payload.ts)
- [Outbox schema](../../packages/database/src/schema/jobs/email.ts)
- [Repository](../../packages/database/src/repositories/jobs/email.ts)
- [Enqueue service](../../packages/emails/src/jobs/enqueue.ts)
- [Delivery](../../packages/emails/src/jobs/delivery.ts) and [worker](../../packages/emails/src/jobs/worker.ts)
- [Provider selection](../../packages/emails/src/node/provider.ts)
- [Cipher](../../packages/emails/src/node/cipher.ts)
- [Renderer boundary](../../packages/emails/src/renderer.ts)
- [Tests](../../packages/emails/tests)
