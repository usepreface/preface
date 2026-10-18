# Organization SAML

Organization owners can configure SAML 2.0 alongside [OIDC](oidc.md). Both use the same global
users, proof-authorized account links, organization approvals, source-backed sessions and [required SSO
and owner recovery](required-sso.md). An IdP assertion grants neither membership nor instance
authority. Provider email and attributes never merge users or assign roles.

## Configuration and trust

A recently email-authenticated organization owner creates a named draft connection. Preface generates
an RSA-2048 signing key and one-year self-signed certificate through the crypto capability. The
private key is encrypted in the existing connection/revision envelope. Public responses contain
only the certificate, fixed entity ID, ACS URL, metadata URL and IdP settings. The metadata endpoint
is readable by known organization/connection IDs; it exposes no organization directory or secrets.

The owner imports SP metadata into the IdP and configures its entity ID, HTTPS Redirect SSO URL,
persistent or explicitly unspecified stable NameID format, and one to five pinned RSA signing
certificates. Certificates must be currently valid and RSA-2048 or stronger. This is certificate
pinning, not public-CA trust. Configuration accepts values directly; no remote metadata URL is fetched.

Testing runs a real browser transaction bound to the owner/session. Completion marks only the exact
revision tested: it creates no account or session. Activation requires that tested revision. Approve
it separately through `samlConnectionIds` in organization policy. Omitted OIDC/SAML lists are preserved
independently; there are at most 20 combined approvals.

Trust edits and the legacy direct SP key rotation increment revision, return to draft, clear testing and revoke
outstanding flows/evidence. Update the IdP's imported SP certificate after rotation and test again.
Name-only edits preserve trust. IdP issuer and NameID format are immutable after first activation;
replacing the identity namespace requires a new connection. Disablement retains history and invalidates
its evidence. All mutations and audit rows share a transaction and preserve the last prepared owner.
For rollover, add a currently valid IdP certificate alongside the old one, test and activate the new
revision, then remove the retiring certificate. Runtime verification excludes expired or not-yet-valid
IdP pins and requires a usable current certificate; an expired retired pin cannot disable a valid replacement. SP certificates need deliberate
rotation before their one-year expiry. [Staged rollover](connection-operations.md) publishes overlapping SP certificates and preserves identity trust; automatic renewal is not implemented.

## Browser transaction

Preface initiates signed RSA-SHA256 AuthnRequests through HTTP Redirect. `auth.auth_flow` stores the
unique request ID, hashed RelayState and browser token, intent, exact connection revision, initiating
session/user and ten-minute expiry. SAML stores neither nonce nor PKCE context. Required-mode requests
and reauthentication set ForceAuthn. The existing start routes dispatch by connection provider.

The IdP POSTs its base64 response and RelayState to the connection's ACS. This exact POST route accepts
form encoding and an external Origin, with a 256 KiB streaming body limit. Other product mutations
retain trusted-Origin/JSON requirements and 32 KiB limits. XML is limited to 128 KiB; DTD/entity
declarations, encrypted assertions and unsupported signature algorithms are rejected.

ACS resolves and atomically claims the database flow before SDK verification. Node-SAML's cache
interface receives only this already-claimed request context; no process-local cache owns admission.
The adapter verifies both Response and Assertion signatures against pinned certificates, exact request
correlation, issuer, destination, bearer recipient, audience, conditions and authentication dates.
Only the verified assertion subtree supplies NameID, AuthnInstant and the optional configured scalar email attribute; other attributes are ignored.

The stable subject is a purpose-separated digest of the NameID format, qualifiers and value. Accounts
remain scoped to the connection and issuer. Qualifiers, when present, must identify the configured IdP
and SP. Transient/email NameID formats are unsupported. Authentication age uses verified AuthnInstant,
not assertion issuance or callback time. Reauthentication rejects a provider login older than the
request allowance. IdP session expiry caps local evidence and newly created sessions.

Verified identity context is encrypted and staged on the claimed flow. Hashes of Response/Assertion
IDs are reserved in `auth.sso_replay`, uniquely by connection and identifier kind. Replay reservations,
staging and verification audit commit together. They survive connection revision changes and replicas.
ACS issues no authentication cookie; it returns 303 to a same-origin completion GET carrying only the
public flow ID. The dedicated HttpOnly `preface_saml_flow` cookie remains SameSite=Lax, as does the
normal session cookie. Completion requires that browser proof and, for test/link/reauthentication,
the exact original user and session. Signed-out sign-in cannot complete into an authenticated browser.
A mismatched browser cannot consume a staged proof.

Final completion shares OIDC's locked connection → organization → user checks and transaction.
It rechecks trust, current membership, policy, account identity, freshness and expiry. Explicit linking
requires recent local email; sign-in resolves a stable link or verified email through [external enrollment](enrollment.md). Required audit, account/session/evidence
writes and conditional flow consumption commit together. Failures revoke/scrub temporary context;
consumption clears it. Maintenance scrubs expired proofs and removes expired replay rows in bounded
batches. Raw XML, NameID, keys and flow credentials are absent from routine logs and audit metadata.

## Supported profile and verification

The supported profile is SP-initiated HTTP Redirect → HTTP POST, with both Response and Assertion
signed using RSA-SHA256 or RSA-SHA512 and SHA256/SHA512 digests, and one plaintext assertion.
There is no unsolicited IdP-initiated login, assertion encryption, SLO, SCIM or attribute-based authorization. Domain discovery and invitation-authorized signup use [external enrollment](enrollment.md). Browser completion returns to `/api/docs` or the configured dashboard origin; dashboard UI remains separate. IdP employee revocation does not instantly invalidate local
evidence. Current local sources, provider age and local expiry still govern access.

Node-SAML owns XML signature verification; the adapter adds Preface's constrained protocol profile
and explicit destination/issuer/recipient checks. The XML DOM dependency reads the verified subtree;
it is not a second signature implementation. Application tests replace that external capability to
exercise browser binding, replay, revision changes, owner safeguards and freshness. Signed XML tests
exercise the real SDK, including tampering, correlation, recipient/audience mismatch, expiry and entity
rejection. HTTP tests exercise real signed responses through configuration, testing, explicit linking
and sign-in. An isolated Chromium browser smoke check verified that a cross-site form POST
omits the Lax flow cookie, the same-origin completion receives it, and successful sign-in issues
the normal session cookie while clearing the flow cookie. Deployments must complete the built-in test against their actual IdP before activation.

## Source

- [Models](../../packages/protocol/src/model/auth/identity-connection.ts)
- [Replay storage](../../packages/database/src/schema/auth/sso-replay.ts)
- [SAML workflows](../../packages/application/src/auth/saml)
- [Shared completion](../../packages/application/src/auth/organization-identity/completion.ts)
- [Node adapter](../../packages/application/src/node/saml.ts)
- [Certificate adapter](../../packages/crypto/src/node/certificates.ts)
- [HTTP contracts](../../packages/api/src/groups/saml.ts)
- [HTTP handlers](../../apps/server/src/http/routes/auth/saml.ts)
- [Signed SDK tests](../../packages/application/tests/unit/auth/saml-provider.test.ts)
- [HTTP tests](../../apps/server/tests/integration/http/saml.test.ts)
