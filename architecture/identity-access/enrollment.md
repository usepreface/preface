# External identity enrollment and completion

An organization invitation can enroll a new person directly through an approved OIDC/SAML
connection or an enabled installation Google connection. Ordinary sign-in can attach an
unknown external identity to an existing eligible user after sufficient email proof. Neither
verified domains nor an IdP login creates membership without an invitation. Provider subjects
remain stable account identity; canonical email/profile is not synchronized from provider claims.

## Proof and admission

`auth.auth_flow` separates connection ownership from the admission organization and stores an
invitation ID/revision, browser binding, original actor/session when present, temporary provider
context, verified proof time and lifecycle. Invitation replacement increments revision. Callback
completion rechecks the current revision, pending status, expiry, organization, connection,
authentication policy, recipient and current inviter/delegation authority.

Unknown identities use one of these mailbox proofs:

- An exact current [connection-domain binding](domains.md).
- An exact-recipient invitation credential whose current email job was sent within ten minutes.
  Enqueueing or an uncertain delivery result is insufficient. Resend replaces the credential and
  delivery job; the freshness window is checked at completion, not reserved at start.
- A browser/flow-bound email challenge after provider authentication.
- Google-verified Gmail addresses or an email whose domain matches Google's signed hosted-domain
  claim. A verified third-party Google address alone still needs mailbox verification.

Existing bindings resolve by connection/issuer/subject first. Deliberate unlinks cannot silently
reconnect, conflicts cannot transfer identities, and email matching never merges two user records.
Ordinary enterprise sign-in requires current membership; only an eligible invitation admits a new
user/member. A signed-in enrollment must remain bound to its initiating user/session. Disabled
users, unavailable emails, suspension and expired/replaced authority cannot be bypassed.

SAML email mapping is an optional `emailAttribute` in IdP configuration. Only one scalar value
from the SDK-verified assertion is accepted; ambiguous attributes fail. An existing explicitly
linked subject can still sign in without an email attribute. Account identity remains the hashed
stable NameID context. OIDC and Google also carry their validated token expiry into staged proofs.

## Continuation and transactions

OIDC/Google exchange once; SAML retains its durable request/replay handling and cross-site
POST → same-origin completion. A provider proof requiring mailbox verification is encrypted in
the shared flow envelope. Staging clears recoverable PKCE context. The callback sets a separate
HttpOnly `preface_external_flow` cookie and redirects to the verification route without a session.

`auth.external.status/request/verify/resume` require the browser token, current actor binding,
live flow/connection and unexpired provider identity. Proofs use `external_identity_email`, a
challenge-bound HMAC, durable five-attempt budget and encrypted `identity-verification` email.
Replacement retires prior challenges/jobs. Wrong attempts commit before returning the failure.
Flow start is capped by invitation expiry; continuation status, browser cookie and email challenge
use the earliest flow, provider-proof or IdP-session deadline.
Successful mailbox verification is durably consumed and recorded; final admission separately
rechecks all authority. A failed final write can resume the still-live verified flow without another
provider exchange. Repeated completion cannot mint another session.

Final completion locks connection → organization → user and consumes the flow conditionally.
Account creation/linking, verified invited user/email, membership/readmission, current roles/teams,
session, source-backed evidence, invitation consumption, email cancellation and audit share a
transaction. Shared invitation admission is also used by ordinary email acceptance. Same-email
creation conflicts retry only the local transaction, never the provider exchange. Audit failure
rolls back the business writes. Maintenance scrubs expired staged ciphertext.

SSO proof never manufactures recent local-email evidence or instance-management authority.
Required enterprise SSO checks the exact connection and actual provider authentication age.
Google invitation choices are unavailable when the target requires enterprise SSO. Existing owner
recovery remains explicit. Changes to provider email do not move a known account to another user.

## HTTP and deployment

- `POST /api/v1/invitations/inspect` includes eligible methods and required-SSO state after token validation.
- `POST /api/v1/invitations/authentication/start` selects a connection and binds invitation/profile intent.
- `GET /api/v1/auth/external/flows/:flowId` reads safe next-action, masked email and expiry.
- Flow `/email/request`, `/email/verify`, and `/complete` POSTs use JSON, trusted Origin and the browser cookie.
- `POST /api/v1/auth/discovery` returns provider choices independently of account existence. Domain
  discovery uses generic labels and no private user membership list; explicit organization slugs
  reveal their configured connection labels. More than 50 matching domain claims disables broad discovery.
- Authenticated `/api/v1/auth/organizations/:organizationId/select` returns the target's current
  authentication requirements. Selection is not a grant or a cached authorization decision.

`DASHBOARD_URL` optionally supplies a trusted frontend origin. Expected browser callback failures redirect to its `/auth/error` with a public error code; backend-only mode retains typed API errors. It is included in allowed mutation/
CORS origins and supplies email/setup destinations and callback returns. `PUBLIC_URL` remains the
backend provider callback/ACS/metadata origin. Empty/unset dashboard configuration preserves
backend-only `/api/docs` completion. Return paths must be bounded local paths without authority,
backslashes or control characters. Session credentials stay in HttpOnly API-host cookies.
Deploy dashboard/API on the same site with HTTPS; arbitrary third-party-site cookie deployments
are not supported by the current SameSite=Lax design. Product dashboard wiring remains separate.

## Verification and limits

Real-repository regressions cover trusted OIDC enrollment, SAML code continuation, browser mismatch,
replacement/replay, existing-user implicit linking and unlink protection, and fresh invitation proof.
The HTTP test exercises typed invitation discovery/start, callback cookies, code verification and
the resulting member session. SDK fixtures assert signed token expiry and provider validation.
No DNS-only admission, canonical email changes, new MFA/passkeys, SCIM, global domain capture,
unsolicited IdP-initiated SAML or provider logout is implied by these workflows.

## Source

- [Completion and proof modules](../../packages/application/src/auth/external)
- [Shared invitation admission](../../packages/application/src/organization/invitation/admission.ts)
- [Flow storage](../../packages/database/src/schema/auth/auth-flow.ts)
- [HTTP contracts](../../packages/api/src/groups/auth/external.ts)
- [Discovery](../../packages/application/src/auth/discovery.ts)
- [HTTP handlers](../../apps/server/src/http/routes/auth/external.ts)
- [Workflow tests](../../packages/application/tests/integration/auth/enrollment.test.ts)
- [HTTP regression](../../apps/server/tests/integration/http/enrollment.test.ts)
