# Enterprise connection operations

Organization owners inspect observed connection health and manage staged SAML SP signing keys.
These operations reuse current organization authorization; mutations additionally require recent
local-email proof. Instance ownership alone grants no organization access. The existing offline
owner recovery path remains necessary when a required-SSO provider is unavailable.

## Health and delivery

`GET /api/v1/organizations/:organizationId/identity-connections/:connectionId/health` reports the
connection revision, lifecycle, last successful test, policy approval and usable bound-domain
proof. SAML certificates report fingerprint, expiry and valid/expiring/expired/not-yet-valid/invalid
state. This is a stored-configuration observation, not a live provider availability probe or MFA claim.

Invitation managers can read `/api/v1/organizations/:organizationId/invitations/:invitationId/delivery`.
It exposes delivery status, attempt count, provider, safe failure code, retry availability, expiry and
sent time for the invitation's current job. It never exposes encrypted content, credentials or provider
message IDs. Resending uses the existing invitation workflow, replacing its credential and job.
An accepted provider request does not prove delivery to an inbox.

## Staged SP rollover

The owner prepares one replacement under `/identity-connections/:connectionId/saml/keys`, using the
current `expectedRevision`. Preface generates an RSA signing certificate and stores its private key
in a purpose-separated encrypted envelope bound to key ID, connection, revision and certificate.
Public key records expose only certificates and lifecycle. At most one pending candidate exists;
the bounded history retains up to 50 records per connection. Retired certificates are historical records.

Metadata immediately advertises the current certificate and the usable candidate. Import this metadata
at the IdP before starting the candidate's `/test` workflow. That request signs with the candidate key;
its browser/session-bound callback marks only that exact candidate tested. It does not retest or
activate the live connection, create an account or establish user authentication evidence.

`/activate` requires a successful candidate test within 15 minutes, the same connection revision and
an unexpired candidate. It atomically replaces the current encrypted SP key, marks the previous
certificate retiring, clears the candidate's separate private-key ciphertext and writes audit. Metadata
continues publishing the old certificate until explicit `/retire` or certificate expiry. Retirement of
the current signing key is rejected. Candidate tests that finish after retirement cannot activate it.

SP signing rollover does not change the trusted IdP's identity authority. It preserves the connection
trust revision, active status, linked identities and existing authentication evidence. IdP trust changes
still increment revision, return to draft and revoke flows/evidence. The older direct
`/saml/rotate-signing-key` endpoint retains that disruptive behavior; use staged rollover for planned
maintenance. Overlapping IdP certificate pins are configured through the existing IdP settings and
must pass a new connection test and activation.

A candidate expires seven days after preparation or earlier at certificate expiry. Trust-revision changes
also make it unusable. Bounded maintenance retires these candidates and scrubs their recoverable key.
No worker silently activates or generates a replacement that an IdP has not imported.

## Expiry warnings

After startup migration/preparation, the authentication maintenance worker scans SAML connections in
bounded cursor pages. Within 30 days of certificate expiry, including already expired certificates,
it locks the current connection and organization, rechecks the certificate and enqueues an encrypted
owner security notification alongside required audit. The audited fingerprint deduplicates warnings
across replicas and restarts. Malformed historical certificates remain visible through health;
maintenance does not guess an expiry for them. Archived organizations and disabled connections are skipped.
Delivery occurs through the existing outbox worker outside the SQL transaction.

## Verification and limits

Lifecycle integration tests exercise untested/retired candidates, metadata overlap, evidence preservation,
private-key cleanup and warning deduplication. SDK tests exercise signed email extraction, ambiguous
attribute rejection and overlapping metadata certificates. These checks do not establish every vendor
profile; see the [provider compatibility matrix](providers.md).

Sources: [key workflows](../../packages/application/src/auth/saml/keys.ts),
[health](../../packages/application/src/auth/organization-identity/health.ts),
[maintenance](../../packages/application/src/auth/organization-identity/maintenance.ts),
[key storage](../../packages/database/src/schema/auth/identity-connection-key.ts),
[HTTP contracts](../../packages/api/src/groups/connection-operations.ts).

## IdP application tile

`GET /api/v1/organizations/:organizationId/identity-connections/:connectionId/saml/login`
starts a fresh SP-bound transaction and redirects to the IdP after setting the browser proof cookie.
It accepts an optional validated relative `returnPath`. A signed-out visitor enters normal SSO sign-in;
an authenticated current member enters forced reauthentication. The connection must be active and
approved. Unsolicited responses still fail request correlation, and this entry point creates no
membership without an invitation. An unlinked signed-in member uses the explicit linking workflow.
