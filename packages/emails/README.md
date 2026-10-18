# @usepreface/emails

Typed, durable outbound email services for Preface. Requires Node.js 24, Effect v4
and the shared PostgreSQL services from `@usepreface/database`. Supports Resend,
Inbound, Amazon SES v2 and SMTP through their respective SDKs/libraries.

The server uses `AuthenticationEmailRenderer.layer` for minimal operational setup
and sign-in/reauthentication code/link messages, organization invitations and invitation verification
messages, and starts a scoped delivery worker. React Email
presentation is not included. `SetupEmailRenderer.layer` supplies setup messages
when composed separately. Invitation names and links are escaped in HTML.

## Enqueue email

Application workflows acquire `EmailJobs`. Enqueue inside the same
`TransactionService.run` as the challenge or invitation and its required audit.
The workflow creates credentials, determines recipients and supplies trusted URLs;
email services do not create accounts or grant access.

```ts
import { Effect } from "effect";

import { TransactionService } from "@usepreface/database";
import { EmailJobs, type EnqueueEmail } from "@usepreface/emails";

export const enqueueEmail = Effect.fn("enqueueEmail")(function* (input: EnqueueEmail) {
  const transaction = yield* TransactionService;
  const emails = yield* EmailJobs;
  return yield* transaction.run(emails.enqueue(input));
});
```

`EnqueueEmail` is a discriminated union: `type` selects the exact `variables`.
Supported payload contracts are `instance-setup`, `sign-in`, `organization-invitation`,
`invitation-verification`, `email-reauthentication`, `identity-verification` and
`organization-security`, exported from `@usepreface/protocol/model`. Each payload is wired
to application workflows and a minimal operational renderer.

Each request also supplies a stable business `idempotencyKey` and `expiresAt`, with
optional `availableAt`. Expiry cannot exceed the credential deadline in the
template variables. `enqueue` returns an `EmailJobId`, not a delivery receipt.
Repeated equivalent requests return the existing ID; conflicting content or expiry
fails with `EmailError` / `IDEMPOTENCY_CONFLICT` without replacing the job.
`cancel(id)` clears pending/processing payloads, but cannot recall an external send
already in flight. The linked operation must independently enforce revocation.

## Services and Layers

- `EmailJobs.layer` requires `DatabaseRepository` and `EmailPayloadCipher`.
  `EmailPayloadCipher.layer` adapts the shared `SecretCrypto` service.
  Enqueueing does not require a renderer or provider.
- `EmailRenderer` accepts `EmailPayload` and returns
  `{ subject, html, text }` as an Effect with `EmailError`. Implement it with
  code-owned React Email templates and an exhaustive switch on `payload.type`.
  Template props use the exported variable schemas; callers cannot override
  subjects, sender, headers or rendered content through `EmailJobs`.
- `EmailService.layer` requires `EmailRenderer`, `EmailSender` and `EmailProvider`.
  Its typed `send` renders and dispatches one email, rechecks expiry after rendering,
  and applies a ten-second deadline. It is the worker boundary, not the normal
  application entry point.
- `EmailDelivery.layer` requires completed `DatabaseMigration`, `Database`,
  `DatabaseRepository`, `EmailPayloadCipher`, `EmailService`, `EmailProvider` and
  platform `Crypto.Crypto`. `processOnce` claims and processes at most one job,
  returning `0` or `1`. It refuses execution inside a SQL transaction.
- `EmailWorkerLayer` requires `EmailDelivery`. It starts one scoped sequential
  worker, waits two seconds when idle or after an expected infrastructure failure,
  and stops with its owning scope. Unexpected defects are not swallowed.
- `DevelopmentEmail.layer` logs recipient, sender, subject and plain-text body,
  including authentication codes/links. It makes no external request.
- `@usepreface/emails/testing` exports `TestEmails.layer`, providing `EmailProvider`
  and scoped capture/failure controls. It simulates Resend-style idempotency.

Compose shared Layers once. Supply the same provider to `EmailService` and
`EmailDelivery`, and the same database composition to repositories and workflows.
The server starts its delivery worker after migrations and startup preparation.
No new worker application or in-memory queue is required.

## Configuration

`@usepreface/emails/node` exports `ConfiguredEmailProvider` and
`NodeEmailPayloadCipher.layer`. Configuration is acquired through Effect Config,
never read on import. Supply `NodeCrypto.layer` at the runtime boundary.

| Variable                         | Meaning                                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `EMAIL_PROVIDER`                 | Required: `development`, `smtp`, `resend`, `ses` or `inbound`.                                     |
| `EMAIL_FROM`                     | Required sender for `EmailSender.layer`, e.g. `Preface <notifications@example.com>`.               |
| `EMAIL_REPLY_TO`                 | Optional reply-to address.                                                                         |
| `CRYPTO_ENCRYPTION_KEY`          | Required 32-byte standard-base64 encryption key; legacy `EMAIL_ENCRYPTION_KEY` remains a fallback. |
| `CRYPTO_HMAC_KEY`                | Required independent 32-byte standard-base64 HMAC key for shared crypto.                           |
| `RESEND_API_KEY`                 | Required only for Resend.                                                                          |
| `INBOUND_API_KEY`                | Required only for Inbound.                                                                         |
| `AWS_REGION`                     | Required only for SES; credentials use the AWS SDK default chain, including IAM roles.             |
| `SMTP_HOST`                      | Required only for SMTP.                                                                            |
| `SMTP_PORT`                      | SMTP port, default `587`.                                                                          |
| `SMTP_SECURE`                    | Immediate TLS, default `false`; use `true` for port `465`. Otherwise STARTTLS is required.         |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | Optional paired SMTP credentials for authenticated relays.                                         |

`ConfiguredEmailProvider` reads only the selected provider's configuration. For
console delivery, set both `EMAIL_PROVIDER=development` and `NODE_ENV=development`.
The selector refuses development logging in other environments. Directly providing
`DevelopmentEmail.layer` is an explicit development-only composition choice.
Set `NODE_ENV=production` in production; Resend's SDK can emit its own error
diagnostics outside production. Inbound SDK logging and automatic retries are disabled.

Generate each crypto key independently locally, store it in deployment secrets and back it up
with the database:

```sh
node --input-type=module -e 'import { randomBytes } from "node:crypto"; console.log(randomBytes(32).toString("base64"))'
```

The [crypto package](../crypto/README.md) owns AES-256-GCM encryption and keyed fingerprints.
AES-256-GCM encrypts recoverable outbox payloads. A purpose-separated HMAC identifies
equivalent payloads without exposing low-entropy codes to offline digest guessing.
Changing the key makes outstanding jobs unreadable and changes deduplication
fingerprints; rotation/key rings are not implemented. This key does not replace
the authentication challenge digest used to verify a submitted code.

## Delivery guarantees

The `jobs.email` table stores encrypted payloads and token-owned 30-second leases.
Claims use PostgreSQL `FOR UPDATE SKIP LOCKED`. Provider calls happen after the
claim transaction commits. At most five attempts use exponential backoff starting
at five seconds; retries never extend the job deadline. Terminal states clear
recoverable payloads and retain safe delivery metadata.

The job UUID is the provider idempotency key. Resend supports replay within its
documented 24-hour window; Preface conservatively stops abandoned retries older
than one hour. Inbound receives the key but is treated conservatively because this
adapter does not establish a retention guarantee. SMTP and SES have no equivalent
idempotency guarantee here. Uncertain sends or abandoned leases without replay
protection become terminal `UNKNOWN_OUTCOME`; known transient rejection can retry.
There is no automatic provider failover. Jobs remain pinned to their first provider;
changing configuration does not reroute previously attempted jobs.

Nodemailer cannot cancel an active SMTP send through the adapter's public transport
API. It may finish after the Effect deadline; connection/socket inactivity timeouts
remain bounded, and the uncertain outcome is not automatically replayed.

Acceptance is not proof of inbox delivery. Bounce/complaint webhooks, delivery
reconciliation, operator retry APIs and metadata retention cleanup are not included.
Expired/cancelled credentials must still be rejected by their owning auth workflow.

## Verification

```sh
pnpm --filter @usepreface/emails typecheck
pnpm --filter @usepreface/emails lint
pnpm --filter @usepreface/emails test
pnpm exec turbo run build --filter=@usepreface/emails
PREFACE_TEST_POSTGRES_PORT=55439 pnpm --filter @usepreface/emails test
```

The PostgreSQL lane uses the database package's explicit disposable test
configuration; never point it at a deployment database. Tests exercise real migrated
repositories and encryption with a test-only renderer, and intercept SDK network
boundaries without sending live email. No React Email templates are created by tests.

The typed `organization-security` payload reports SSO policy changes, offline credential
rotation/revocation and recovery. Variables are `{ organizationName, action, occurredAt }`; they
never contain credentials. Application workflows enqueue these alerts transactionally for current
usable owners, with a seven-day delivery deadline. `AuthenticationEmailRenderer.layer` supplies the
minimal escaped renderer. The service checks notification age independently of credential deadlines;
existing verification messages retain their credential-bound expiration checks.
