# Google identity and organization opt-in

Google is an installation-owned login connection. Instance owners configure and test
credentials; organization owners opt into accepting Google evidence. User identity,
organization admission and roles stay in Preface. A Google callback never creates a
user, email address or organization membership, and matching emails never link accounts.

## Configuration and ownership

`auth.identity_connection` stores one Google connection per installation, versioned public
client configuration, encrypted credentials, revision, test timestamps and
`draft | tested | active | disabled` state. Installation ownership references the fixed
installation row key, not its public UUID. Organization-owned OIDC/SAML configuration
is not implemented.

Saving configuration requires current instance ownership and usable email evidence no
older than five minutes. The installation lock coordinates owner changes, followed by the
connection lock. Each save increments revision, moves to draft, clears testing and revokes
pending flows and Google evidence. Omitted client secret preserves and re-encrypts the
existing secret; first save requires one. Encryption envelopes include connection ID and
revision and validate both on decrypt. Reads expose only public settings and a secret-present
flag. Credentials are never returned or logged.

A browser test authenticates at Google, rechecks the initiating Preface session and instance
ownership, and marks that exact revision tested. It creates no account binding or session
and does not switch users. Activation requires the current tested revision. Testing an
already active revision preserves its active state. Disable increments revision, clears
testing and invalidates flows/evidence. Reactivation requires testing the new revision;
old evidence cannot revive. Repeated active/disabled actions are authorized no-ops.

## Identity and browser transaction storage

`auth.account` binds a user to connection, issuer and case-sensitive subject. The tuple is
unique across linked and unlinked history; an identity cannot be claimed by another user
after unlink. One active identity per user/Google connection is supported. The same user can
explicitly reconnect an old binding. Provider email/verification are display claims and do
not attach, verify or replace Preface email. Profile metadata and pictures are unchanged.
Google access, refresh and identity tokens are not persisted.

`auth.auth_flow` records `sign_in | link | reauthenticate | test`, connection/revision,
initiating user/session where applicable, state/browser/nonce digests, encrypted PKCE context,
expiry and claim/consumption/revocation. Authenticated intents require the exact initiating
session and user. Composite references prevent mismatched source identities. Flows expire
in ten minutes. The backend currently allows only `/api/docs` as its return destination.

The encrypted temporary PKCE envelope includes flow ID, verifier and the exact nonce/state
needed by the OIDC library. The ID is validated after decrypt; independent digests provide
lookup/binding. Terminal paths clear the whole envelope. Maintenance scrubs expired contexts
in batches and removes records at least one day past expiry; audit remains independent.

## Provider boundary and callback

`GoogleIdentity` is the application capability; `NodeGoogleIdentity.layer` implements it
with `openid-client`. Endpoints and issuer are fixed to Google's HTTPS profile. Authorization
uses code flow, PKCE S256, transaction nonce/state and `openid email`. Signature validation is
explicitly enabled, with RS256, issuer/audience/lifetime and nonce validation. Only Google's
public JWKS cache is shared within the layer. Credentials/configuration are loaded freshly.
Provider requests have a ten-second SDK timeout, a fifteen-second exchange deadline, reject
redirects and use cancellation. Native errors and tokens never cross the adapter boundary.

Callback processing has three boundaries:

1. A short transaction verifies state/browser/session binding and atomically claims the flow.
2. Provider exchange and signature/claim validation run without an SQL transaction.
3. A final transaction locks the current connection, then user where needed, rechecks revision,
   identity/source/session authority and atomically writes binding/evidence/session, consumption
   and required audit. Test callbacks take installation before connection for owner coordination.

A claim admits one exchange. Replay, concurrent callbacks, expiry, cancellation and mismatched
browsers fail. Uncertain exchanges and final-write failures require a new browser flow;
authorization codes are never automatically retried. Failure revokes the claimed flow and
scrubs its context. If failure cleanup itself cannot commit, the claim still prevents replay
and expiry maintenance supplies eventual scrubbing. Account/configuration writes and required
audit share their business transaction.

## Linking, sign-in and reauthentication

Linking requires recent email evidence at initiation and finalization. It binds only the
current user, refuses another user's historical identity, and records Google evidence in the
current session. Ordinary sign-in is signed-out only and requires an active linked account,
enabled user and usable verified primary email recovery path. It issues the existing opaque
Preface cookie session. Google reauthentication requires the returned binding to belong to
the initiating user; it adds evidence without changing session identity or expiry.

Email reauthentication is separate from signed-out email sign-in. It reuses `auth.verification`
with `email_reauthentication`, required user/address/job sources and initiating session in
versioned context. Request/replacement uses the user lock and a session-bound purpose-separated
subject. Codes/links expire in ten minutes, bounded by session expiry, and share a five-attempt,
one-use budget. Browser binding, current session and address eligibility are rechecked.
Failed attempts commit before their public error. Verification adds email evidence to the same
session; proof consumption, mail cancellation and audit are atomic. Other proof purposes cannot
be used here. The link reserves `/auth/email/reauthenticate` for the future UI; code verification
already works through the API.

Unlink requires recent email evidence and a usable primary email login path. It locks connection
then user, retains binding history, revokes account evidence and pending authenticated flows,
and audits atomically. Independent email evidence remains usable. Session logout revokes its
pending authenticated flows; logout-everywhere shares the user lock with issuance.

## Evidence and organization policy

`session_authentication` is a discriminated email/Google source. Email requires its user-email
reference; Google requires account and connection revision. Composite foreign keys keep sources
and sessions on the same user. Usable Google evidence additionally requires a linked account,
active connection and current matching revision. Trust changes and unlink revoke evidence;
source joins independently enforce current state. A session needs at least one usable proof.
Evidence contains no role or membership grants.

Organization policy keeps its existing revision/allowed-methods row. Google is opt-in; both email
methods remain enabled by the public editor. Updating requires organization ownership, recent
email and expected policy revision. Enabling also requires an active instance connection; updates
coordinate connection then organization locks and required audit. Instance ownership alone does
not authorize tenant changes.

Google-only sessions cannot access email-only organizations. Email reauthentication adds the
required proof without logout. Removing Google from a policy takes effect on subsequent access
checks. Global disable preserves organization preferences but makes Google unavailable everywhere.
Method discovery distinguishes configured organization preference from current global availability;
public discovery reveals only installation-wide availability, never private organization policy.
An active member can discover the organization's methods before satisfying that method policy;
this permits choosing email reauthentication without granting content or administration access.

## Runtime, verification and limits

The server supplies the adapter, trusted origin and scoped maintenance after migrations/startup.
Google credentials are configured through authenticated APIs and use the existing encryption key;
there are no additional required environment variables. Temporary browser cookies are HttpOnly,
host-only, SameSite=Lax and Secure on HTTPS. Starts require trusted-Origin JSON. The cross-site GET
callback uses state/browser binding and logs only its normalized route, never query values.
Success returns 303 to the allowed path and delivers new sessions only by cookie. Errors use safe
`IdentityError` codes and existing infrastructure mapping.

PGlite application tests cover configuration testing, explicit linking, unknown identity denial,
replay/browser binding, account conflicts, organization opt-in, reauthentication, required-audit
rollback and in-flight revocation. The same workflows run against disposable PostgreSQL. Adapter
tests supply signed token/JWKS responses through the HTTP boundary and verify signatures,
audience, nonce and PKCE/callback exchange. HTTP tests cover secret-free configuration, cookies,
cancellation and reauthentication. Real deployments must complete the actual Google browser test
before activation; repository tests do not use operator credentials or send live mail.

This is a backend API with Scalar as its working completion destination. Dashboard integration,
enterprise OIDC/SAML, Google Workspace domain enforcement, Google-only organization policies,
provider logout and Google account-deprovisioning notifications are not implemented. A valid
Google login establishes bounded local evidence; later external provider changes do not instantly
revoke an already issued Preface session. Local disable/unlink and normal session expiry do.

## Source

- [Protocol identity contracts](../../packages/protocol/src/model/auth)
- [Identity repositories](../../packages/database/src/repositories/auth)
- [Google workflows](../../packages/application/src/auth/google)
- [Email reauthentication](../../packages/application/src/auth/email-reauthentication.ts)
- [Google adapter](../../packages/application/src/node/google.ts)
- [HTTP contracts](../../packages/api/src/groups/google.ts)
- [HTTP handlers](../../apps/server/src/http/routes/google.ts)
- [Workflow tests](../../packages/application/tests/integration/auth/google.test.ts)
- [Provider validation tests](../../packages/application/tests/unit/auth/google-provider.test.ts)
