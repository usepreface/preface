# Required organization SSO

Invitations also support direct enterprise SSO/Google enrollment and inline mailbox verification through [external enrollment](enrollment.md). The email-only path below remains available; its required-SSO next action does not apply when enrollment already supplies acceptable enterprise evidence.

Organization owners can require authentication through an approved organization OIDC or SAML connection.
The organization Google connection does not satisfy this requirement. Global email login,
organization membership discovery, account linking and explicit owner recovery remain available.
Instance ownership grants no exemption. [OIDC](oidc.md) and [SAML](saml.md) own provider configuration
and browser transactions; [invitations](invitations.md) own admission.

## Policy and evidence

`organization.auth_policy` adds `ssoMode` (`optional` by default, or `required`) and
`ssoMaxAgeSeconds` (default 43,200; supported range 300–604,800). The existing connection relation
is the allowlist. Email methods remain configured: required mode adds a condition to organization
access, rather than disabling installation identity or mailbox verification.

`OrganizationAccess` evaluates current source-backed session evidence on every organization/team
access. Required mode accepts only OIDC or SAML evidence whose exact connection is approved, active and at
the recorded trust revision, with a linked account, active membership and enabled identity. The
provider authentication time must satisfy the current maximum age. Local email and installation
Google evidence do not satisfy required SSO. Ordinary operations, including owner management, fail
closed when suitable evidence is absent. There is no outage-triggered email fallback.

`auth.session_authentication.providerAuthenticatedAt` stores validated OIDC `auth_time` or SAML `AuthnInstant`.
The existing `authenticatedAt` remains the time Preface obtained evidence. A callback cannot make
an old provider login fresh. Existing evidence without provider authentication time remains usable
for optional policy and installation identity, but cannot satisfy required SSO. Up to 60 seconds of future
clock skew is tolerated; deployments need synchronized clocks.

`auth.auth_flow.requestedMaxAgeSeconds` records the request's `max_age` requirement. Required-mode
sign-in/link requests use the current policy age; reauthentication uses `prompt=login`, `max_age=0`.
The OIDC SDK validates the requested age and requires `auth_time`. SAML uses ForceAuthn and
checks verified AuthnInstant, including request-relative freshness for reauthentication. Final completion additionally rechecks
the current organization policy under its lock, so tightening enforcement during an exchange cannot
admit stale evidence. Reauthentication adds evidence without extending the session's absolute expiry. Normal request
activity continues to follow the existing idle policy. No MFA assurance is inferred.

## Enrollment and enforcement

Active members can read `/authentication/methods` and explicitly link a provider before satisfying
organization policy. Discovery returns current satisfaction, a next action, safe connection labels,
availability and link status. It distinguishes email login availability from whether email satisfies
organization access. It does not reveal an organization directory to signed-out callers.

Invitation acceptance verifies the intended mailbox and commits membership, currently authorized
role/team assignments, email session and audit as before. Its response adds `nextAction`: required
organizations return `authenticate_with_sso`. Email admission grants no SSO exemption. The member
links an approved provider using a current authenticated session and completes suitable OIDC or SAML authentication
before using their assignments. There is no pending-enrollment table, email-based identity merging,
provider-driven signup or just-in-time membership.

An owner prepares a tested active approved connection, links their account, completes provider
reauthentication, and issues an offline recovery credential before enabling enforcement. The policy
PATCH requires its current revision, a current authenticated session, provider authentication within the configured policy age,
and possession of that owner's recovery credential. Checking possession does not consume it.
`GET /auth-policy/readiness` reports blockers and safe owner/connection readiness; the mutation
rechecks conditions. Readiness cannot establish future provider uptime or prove that a credential
was saved outside the browser.

Policy edits preserve omitted settings, increment revision only for a real change, and serialize
with organization authority. Changes to required policy must preserve a prepared owner and leave the
acting owner authenticated under the resulting policy. Unrelated revisions do not invalidate all
proofs; current connection membership and age are evaluated directly.

## Owner safeguards

A prepared recovery owner has active ownership/membership, an enabled user, usable verified primary
email, a linked account on an active approved connection, and an unused offline credential. They do
not need a currently active session. Required mode must retain at least one such owner.

Owner departure, suspension, revocation and transfer check the remaining owners under the common
organization lock. Removing an approved provider, disabling/changing connection trust, unlinking
an account, or revoking an offline credential also checks the resulting recovery paths in its
transaction. Rejected changes roll back. A display-name-only connection edit preserves trust.

A new owner in required mode needs a linked approved identity. When transferring away the only
prepared owner, first grant the target ownership and let them issue their own credential, then
transfer. Suspension, removal and loss of ownership revoke that member's offline credentials with
required audit. Reinstatement or later ownership grants cannot resurrect those credentials.

Connection/account changes use connection → organization → user lock order where relevant. Recovery
and owner mutations need only the organization lock and do not acquire connection locks afterward.
Provider exchanges remain outside SQL transactions. A future global user/email lifecycle workflow
must coordinate with these organization invariants; it must not disable the last prepared owner
through an unrelated update path.

## Offline recovery

`organization.auth_recovery_token` stores an owner-bound credential digest, organization/member
references and creation/consumption/revocation timestamps. One unused, unrevoked credential is allowed
per member. The crypto package generates 256 random bits and uses a dedicated digest purpose. The
raw secret is redacted in application results and returned once by the rotation endpoint with
`Cache-Control: no-store`. Ordinary reads, audits and notification payloads never contain it.

Credentials have no automatic expiry. Owners store them offline, for example in a password manager.
Rotation revokes the previous credential and issues its replacement atomically. Normal issuance and
revocation require organization owner access with a current authenticated session;
revoking the last required recovery path is rejected.

To recover, an owner signs into Preface by email, obtains a current authenticated session, reads the current
revision through readiness and submits their credential to `/auth-recovery/recover`. This narrow
path verifies current ownership independently of organization SSO. It consumes the credential,
switches policy to optional, appends recovery/policy audits and enqueues owner alerts in one
transaction. Concurrent attempts admit one transition. A failed audit or outbox write rolls
back consumption and policy changes. No external provider is contacted.

Recovery grants no new membership, role or operator authority. It preserves provider
settings and account bindings for deliberate repair or disablement. Enabling SSO
again requires a replacement recovery credential and policy-valid provider proof.

There is no API bypass if both provider access and all prepared owners' offline credentials are
lost. A lost rotation response requires rotation again through normal owner access; secrets cannot
be retrieved from storage. Recovery is an explicit relaxation of organization authentication and
is reported to current owners.

## Notifications and verification

Typed `organization-security` jobs report policy changes, credential rotation/revocation and
recovery. Current usable owners' verified primary addresses are selected inside the transaction.
Jobs contain a fixed action, organization display name and event time; the encrypted outbox has
a seven-day delivery deadline. The renderer escapes names. Provider delivery remains asynchronous;
committing a notification does not prove inbox delivery.

Workflow tests use real migrated repositories and cover readiness/possession, organization isolation,
email versus SSO, signed provider authentication age, invitation enrollment, unsafe owner/provider
changes, credential rotation/replay, recovery after a week, audit/outbox rollback and
competing recovery/revocation. SDK tests validate `max_age` and signed `auth_time`; HTTP tests exercise
policy/recovery payload decoding, cookie sessions, safe output and access rejection. PostgreSQL is
the concurrency lane; PGlite supplies fast persistence checks.

[SAML](saml.md) and [domain routing](domains.md) use their own boundaries. SCIM, provider logout
and immediate external deprovisioning remain unsupported. Local evidence may remain usable until its configured age elapses after an employee is
disabled at the provider; explicit Preface membership/session revocation remains available.

## Source

- [Policy contracts](../../packages/protocol/src/dto/organization/authentication.ts)
- [Recovery storage](../../packages/database/src/schema/organization/auth-recovery-token.ts)
- [Organization authorization](../../packages/application/src/organization/access.ts)
- [Policy workflows](../../packages/application/src/organization/authentication-policy.ts)
- [Recovery workflows](../../packages/application/src/organization/authentication/recovery.ts)
- [Owner paths](../../packages/application/src/organization/authentication/owner-paths.ts)
- [HTTP recovery](../../apps/server/src/http/routes/organization/auth-recovery.ts)
- [Enforcement tests](../../packages/application/tests/integration/organization/required-sso.test.ts)
- [Recovery tests](../../packages/application/tests/integration/organization/sso-recovery.test.ts)
