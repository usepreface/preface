# Google identity

Google is an optional sign-in method for the installation's sole organization.
Its connection belongs to that organization, like OIDC and SAML. Configuration is
available to organization owners at `/settings/google` and through
`/api/v1/organization/authentication/google`. Operator status alone is insufficient.

## Configuration

The connection stores a versioned Google client configuration, encrypted client
secret, revision and draft/tested/active/disabled state. Only one Google connection
is permitted. Public responses omit secret material. Omitted update secrets preserve
the stored credential; configuration changes invalidate testing and source evidence.

Owners save a draft, complete an exact-revision browser test, activate it and enable
Google in the single login policy. Testing does not link the operator's account or
switch its session. There is no organization-selection or per-tenant opt-in layer.
Administrative changes need a current authorized session, without an additional
five-minute email confirmation.

## Browser authentication and account identity

Google uses authorization code flow with PKCE S256, state, nonce and browser-bound
HttpOnly proof cookies. `PUBLIC_URL` supplies `/api/v1/auth/google/callback`;
`DASHBOARD_URL` supplies the trusted completion origin. Return paths remain bounded
local paths. Raw tokens, client secrets and provider subjects are not public outputs.
The provider adapter validates signed identity claims; provider tokens are not stored.

Existing members explicitly link through `/api/v1/users/me/accounts/google/start`.
Link completion checks the initiating actor, session, verified primary email,
current membership and identity conflicts. Stable account identity never transfers
to a different user because its provider email changes. Unlinking revokes the account's
source evidence and pending flows; independent email sessions remain usable.

Ordinary Google sign-in requires an enabled connection accepted by the current
policy and an active membership. Unknown users need an eligible invitation.
[External enrollment](enrollment.md) defines direct invitation admission, trusted
Google Gmail/Workspace email proof and additional mailbox verification. An IdP login
never creates membership by itself and user records are never merged.

## Evidence and policy

Session evidence references the current account and connection revision. Session
resolution rechecks connection/account lifecycle and membership. Suspension/removal,
unlinking, disablement and trust changes make that source unusable. Email evidence
remains independently eligible for sign-in and explicit recovery.

Google does not satisfy required enterprise SSO: that policy accepts approved OIDC
or SAML evidence within its configured age. Owners configure those requirements in
[the policy boundary](required-sso.md). There is no separate administrative email
reauthentication endpoint or Google confirmation requirement.

## Verification and limits

Application/HTTP tests cover confidential configuration, test-before-activation,
callback/browser binding, account conflicts, rollback, in-flight disable/unlink and
source revocation. SDK fixtures validate Google identity responses. Disposable
Keycloak journeys verify enterprise protocols, not live Google credentials.

## Source

- [Google workflows](../../packages/application/src/auth/google)
- [Connection table](../../packages/database/src/schema/auth/identity-connection.ts)
- [Session source checks](../../packages/database/src/repositories/auth/session-evidence-source.ts)
- [Public configuration](../../packages/api/src/groups/instance/identity-connections.ts)
- [Google settings](../../apps/dashboard/src/routes/_app/settings/google.tsx)
