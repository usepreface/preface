# Organization OIDC

Organization owners can configure OIDC login connections and approve them for optional or
[required SSO](required-sso.md). An existing member explicitly
links an external identity, then uses it for sign-in or reauthentication. Preface continues to own
users, verified email, admission, roles and teams. OIDC callbacks never create users or memberships
and never merge accounts by email. Instance ownership grants no organization connection authority. Conversely, organization OIDC
evidence cannot authorize instance configuration reads or organization creation by itself; those
require an installation-trusted email/Google proof, and sensitive changes still require recent email.

## Configuration and trust

`auth.identity_connection` has mutually exclusive installation/organization owners. Google remains
installation-owned; OIDC is organization-owned. Organizations can hold multiple connections.
Configuration is a versioned discriminated model; encrypted credentials are separate from public
settings. Encryption binds credentials to connection ID and trust revision. IDs and ownership are
immutable through the API.

The initial supported OIDC profile is authorization code flow, PKCE S256, state and nonce,
`openid email`, RS256 ID tokens, and `client_secret_basic` or `client_secret_post`. Discovery must
advertise code flow, RS256, S256 and the chosen client authentication method when its supported
methods are supplied. Missing provider email is allowed. No UserInfo request is required; access,
refresh and ID tokens are not persisted. No MFA assurance is inferred from arbitrary claims.

Creation checks owner/recent email, discovers metadata outside SQL, then rechecks authority under
an organization lock and commits configuration plus required audit. The saved metadata contains
only the trusted issuer and supported endpoints/configuration. A client secret is mandatory on
creation, encrypted at rest and never returned. Omission on update preserves it.

`draft -> tested -> active` requires a real browser test of the exact revision. Test completion
rechecks the initiating session, current owner authority and email evidence no older than five
minutes. It creates neither account binding nor session evidence. Testing an active connection
preserves active state. Activation records `activatedAt`; subsequent issuer/client ID replacement
is rejected even after disabling or a trust change. Use a new connection for a new identity space.

Configuration/secret changes or explicit metadata refresh increment revision, return to draft,
clear testing and revoke flows/evidence in the same audited transaction. Display-name-only changes
preserve trust and evidence. Disable increments revision, re-encrypts the secret for that revision,
clears testing and revokes flows/evidence. Reactivation requires testing again. There is no hard
connection deletion. Repeating an authorized activate/disable is an idempotent no-op.

## Admission and organization policy

`organization.auth_policy_connection` relates the existing policy to accepted OIDC connections.
Composite foreign keys require organization ownership and a same-organization approving member.
The policy revision coordinates relation replacement and audit. Up to 20 distinct connections can
be accepted. A method named `oidc` alone never accepts another connection or tenant's proof.

Activation and approval are separate. Approval adds a login method; both email methods remain configured. Required mode additionally
requires approved organization proof for access, as described in [required SSO](required-sso.md). Existing Google-only updates preserve OIDC approvals. New approvals require active
connections; existing disabled approvals remain visible as unavailable. Discovery requires a current
session and active membership, but not acceptable organization evidence, so a member can choose a
reauthentication path. It returns labels, IDs, availability and the current user's link status,
not issuer settings or credentials. Full connection configuration is owner-only.

Linking needs an active organization member and recent local email at both start and completion.
It can prepare an active connection before policy approval; it grants no content access by itself.
An invited member first completes existing mailbox-verified admission and can then link. Ordinary
OIDC sign-in needs an already linked identity, active membership, an active approved connection,
an enabled user and a usable verified primary Preface email. There is no provider-driven signup,
just-in-time membership, domain admission or role synchronization.

Organization access checks exact approved connection evidence. Removing an approval takes effect
on subsequent organization access; it need not invalidate the global Preface session. Suspension,
removal or organization archival makes that organization's OIDC evidence unusable during session
resolution. Independent email evidence remains usable. Reinstatement may make still-unexpired
source evidence usable again; removal followed by readmission remains governed by current membership.

## Browser flows and consistency

`auth.auth_flow` adds a provider discriminator and requires the owning target organization for OIDC.
Composite references prevent an OIDC flow targeting another tenant. Existing user/session binding,
state/browser/nonce digests, encrypted PKCE context, ten-minute expiry and one-use lifecycle remain.
Google and OIDC callback routes reject each other's flows before claiming them.

Authenticated starts and callbacks require the exact initiating session/user. Starts set a separate
`preface_oidc_flow` HttpOnly, host-only, SameSite=Lax cookie, Secure on HTTPS. Browser callbacks are
cross-site GETs correlated by state and that cookie; mutation starts require the trusted Origin and
JSON. The current completion destination is only `/api/docs`; caller-supplied external return URLs
are rejected. A successful callback returns 303 and exposes a new session credential only by cookie.

Callback processing has three boundaries:

1. Check browser/session/protocol binding and atomically claim an unexpired flow.
2. Load current trust, repeat relevant authority checks, and exchange/validate outside SQL locks.
3. Lock connection, organization and user in order; recheck revision, lifecycle, membership,
   approval and session authority; write account/evidence/session, consume the flow and audit.

Policy edits lock participating connections in stable ID order before the organization. Organization
membership/role mutations share its organization lock. Account linking and unlinking coordinate on
connection/user locks. A concurrent disable, removal or unlink cannot recreate authority at completion.
One claim admits one exchange. Uncertain exchanges/final-write failures require a new flow; there is
no automatic authorization-code retry. Typed failure cleanup revokes/scrubs the flow and audits it.
If cleanup cannot commit, the claim prevents replay and existing maintenance later scrubs expiry.

Account identity is `(connection, issuer, case-sensitive subject)`, unique across unlink history.
Another user cannot claim an old identity; the same user may explicitly reconnect it. Linked accounts
are included in the existing account list without provider subjects or tokens. Unlinking requires
recent local email and invalidates its evidence and pending authenticated flows.

OIDC sign-in issues the normal opaque Preface session. Linking and reauthentication add evidence
without extending its expiry. Reauthentication requests `prompt=login`, `max_age=0` and validates the
provider's authentication time through the SDK. This is fresh provider authentication, not an MFA
claim. Recent-email checks explicitly accept only local email methods, never OIDC.

## Outbound provider boundary

`OidcIdentity` is the Effect capability. `NodeOidcIdentity` uses the existing `openid-client` SDK;
its scoped public JWKS cache is bounded and partitioned by issuer/JWKS URI. Credentials are loaded
freshly. The adapter explicitly enables ID-token signature validation and validates issuer,
audience, lifetime, nonce and PKCE exchange. SDK/native causes remain private.

Unlike fixed Google endpoints, generic discovery can send server requests to configurable hosts.
The Node HTTPS transport rejects credentials/fragments/insecure schemes and all redirects, bounds
responses to 256 KiB, and enforces request/exchange deadlines and cancellation. DNS results are
checked for private/special-use addresses at each outbound request, then vetted addresses are pinned
to a fresh connection, including dual-stack fallback while TLS verifies the original hostname. IPv4-mapped, loopback, link-local,
private, multicast and reserved destinations are rejected by default.

Operators may supply comma-separated exact HTTPS origins in `OIDC_ALLOWED_PRIVATE_ORIGINS` for
internal providers. Organization administrators cannot change this policy. An allowed origin does
not allow another port, insecure HTTP or invalid TLS certificates. Internal certificate authorities
must be trusted by the Node deployment; TLS verification is never disabled. No discovery request is
performed at server startup or while SQL locks are held.

## Verification and limits

Workflow tests compose real migrated repositories, crypto and application with an external-provider
substitute. They cover linking, unknown identity denial, identity conflicts, tenant isolation,
recent-email separation, trust revisions, callback/browser replay and in-flight disable/audit rollback.
SDK tests provide signed OIDC token/JWKS responses and verify dynamic discovery, issuer, audience,
nonce, signature and client authentication/PKCE. HTTPS tests use a disposable certificate trusted
only within the test process to exercise real TLS, body forwarding, redirects and response limits;
DNS regression tests reject a destination that becomes private after discovery. The HTTPS test
fixture requires the `openssl` executable. HTTP tests cover the complete configuration/test/link/
sign-in cookie path through the typed API.

A disposable Dex 2.46.0 run also verified discovery, test, activation, linking, sign-in and
reauthentication against the built backend and PostgreSQL. Its development connector used a
CA-verified HTTPS client; callbacks/session cookies completed in an incognito browser.

OIDC has a backend-only Scalar completion destination. Required SSO and offline recovery are
implemented in the [enforcement boundary](required-sso.md). SAML is implemented in its [own boundary](saml.md). Domain routing, SCIM, provider
logout and immediate external employee revocation notifications are not implemented. A provider disabling an employee does not instantly
revoke existing local evidence; local source checks and session expiry still apply. Provider
compatibility is limited to the documented profile and must be verified against the deployment's
actual provider using the built-in browser test before activation.

## Source

- [Connection and flow models](../../packages/protocol/src/model/auth/identity-connection.ts)
- [Connection persistence](../../packages/database/src/schema/auth/identity-connection.ts)
- [Policy relation](../../packages/database/src/schema/organization/auth-policy-connection.ts)
- [OIDC workflows](../../packages/application/src/auth/oidc)
- [OIDC SDK adapter](../../packages/application/src/node/oidc.ts)
- [Outbound transport](../../packages/application/src/node/oidc/http.ts)
- [Organization access](../../packages/application/src/organization/access.ts)
- [HTTP contracts](../../packages/api/src/groups/organization-identity-connections.ts)
- [HTTP sign-in/callback](../../apps/server/src/http/routes/oidc.ts)
- [Workflow tests](../../packages/application/tests/integration/auth/oidc.test.ts)
- [HTTP tests](../../apps/server/tests/integration/http/oidc.test.ts)
