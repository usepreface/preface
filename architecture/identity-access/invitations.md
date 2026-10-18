# Organization invitations

Invitations admit people to an existing organization. Creating one requires current
`members.manage` and `roles.assign` permissions, scoped to that organization. A
pending invitation grants no access and creates no identity. Instance ownership
alone supplies neither permission. Organization ownership uses its separate workflow
and cannot be assigned by invitation.

## Storage and credentials

`organization.invitation` stores UUIDv7 identity, organization, canonical recipient
email, inviting member, token digest, current encrypted email job, expiry, acceptance
attribution, revocation and timestamps. One unconsumed/unrevoked invitation per
organization/email is allowed. Creating another revokes the previous invitation,
cancels its queued mail and retires its browser proofs in the same transaction.
Expired pending records are replaced by the same path; timestamps remain history.

`organization.invitation_assignment` records role IDs with an explicit organization/team
scope and nullable team ID. Composite foreign keys bind invitation, role scope and team
to one organization. Creation requires 1–20 unique organization roles and optionally up
to 20 unique teams with 1–20 team roles each. Omitted team roles resolve to the built-in
team member role at creation; stored assignments are explicit. Ownership is prohibited.
Team assignment requires current team membership-management and role-assignment authority,
or explicit organization `teams.manage`. See [teams](teams-profiles.md).

Invitation tokens contain 32 random bytes and are stored as purpose-separated
digests. They last seven days. Resend rotates the token and extends expiry to seven
days from resend, while retaining invitation identity and original inviter. It
rechecks both the acting administrator and original inviter's current delegation.
Revocation and acceptance are terminal; resend cannot revive either. A new invitation
can replace an expired one or establish a new inviter.

`auth.verification` has an explicit `invitation_email` purpose and invitation context.
Its source fields stay null until acceptance; it has no user to reference when the
recipient is new. Its email job is required. Ordinary sign-in accepts only its own
`email_sign_in` purpose, including on resend. Purpose-separated code, link, browser
and subject bindings prevent proof reuse across these workflows.

## Email proof and acceptance

A token holder can inspect the organization name/identity and deadline without
exposing the recipient's address or account existence. Requesting verification sends
an eight-digit code and magic link to the stored recipient. It returns only challenge
identity/expiry and sets a separate `preface_invitation` HttpOnly browser cookie.
The code/link lasts ten minutes, bounded by invitation expiry, and shares a five-failure
budget and one-use consumption. Requesting another proof retires the previous proof
and cancels its queued message. There is no resend cooldown or additional rate-limit
table; the existing HTTP request policy still applies.

The original invitation link is insufficient for acceptance. The recipient must
prove the invited mailbox in the browser that requested verification. Codes support
internal hosts where opening the generated public link is inconvenient. The link
format reserves `/invitations/accept#invitationId=…&token=…`; verification links also
carry challenge identity and a separate proof token in the fragment. The server
renders neither that page nor dashboard UI. JSON POST bodies carry credentials to
HTTP handlers; query strings and routine logs must not contain them.

Acceptance locks the organization, reloads the current invitation, and checks:

- Current token, expiry, revocation and unconsumed state.
- Active original inviter, enabled identity, usable primary email and current
  member-management/role-assignment authority. The inviter need not have a live session.
- Current assignments, role lifecycle and inviter delegation envelope.
- Matching invitation/version binding, browser token, code/link, proof expiry and attempts.
- The organization has a current authentication policy; mailbox admission is independent of
  whether the resulting email evidence grants organization access.
- Recipient identity is enabled and its existing address is verified and login-enabled.

An existing active email reuses its existing user identity. A signed-in actor must
match that identity; otherwise `ACCOUNT_MISMATCH` requires an explicit account
switch. No address is attached to an unrelated signed-in user, and no identity is
merged by display name or email similarity. Unusable existing addresses/users fail
rather than being reactivated. Only a valid invitation plus verified proof can
create a new user and verified primary address. Acceptance input requires a display name; it is used only for new users. Existing
profiles are preserved.

Suspended memberships remain blocked. Removed memberships retain their stable ID
and original join time; explicit readmission clears removal and grants only the
invitation's assignments. Removal already revoked prior grants. Active members
retain their existing grants and receive approved additions. A non-owner inviter
cannot change an existing owner's assignments.

Identity/email creation when necessary, organization/team membership or readmission, scoped role grants, fresh
session/evidence, invitation/proof consumption, queued-message cancellation and
required audit commit together. Each acceptance creates a fresh session even for
an already signed-in matching user; it does not revoke other sessions. The new token
is delivered only in the normal session cookie. Current organization evidence checks
apply immediately to that session.

A wrong credential records its failed attempt and audit before returning
`INVALID_PROOF`. Admission or audit failures roll back business writes and leave a
valid proof retryable. Final conditional consumption rechecks expiry. A replay cannot
create another session. Lost successful responses require ordinary sign-in rather
than invitation replay.

## Concurrency and authority

Creation, replacement, resend, revocation and acceptance share the organization lock
with member/role administration. Authority changes committed before a queued acceptance
obtains that lock are observed. Two acceptances of one invitation admit one winner.
Concurrent invitations from different organizations for a new address may race on
active-email uniqueness; the losing transaction retries that specific constraint
and reuses the committed installation identity. No general transaction retry policy
is added. Global user-disable/address mutation workflows are not exposed; future
ones must coordinate their own authority changes with organization admission.

Creation/resend/revocation/acceptance audit records retain organization role IDs and team IDs.
Individual role-grant events retain role, member and optional team identity. Verification
request/failure records retain challenge ID and attempts, never codes, tokens or
email bodies. Email intents use the encrypted outbox. Cancelled work may already
be in flight externally; acceptance independently checks current credentials.

## HTTP and practical limits

Management routes under `/api/v1/organizations/:organizationId/invitations` provide
create, paginated list, resend and revoke. Listing requires `members.manage`, resend
and creation also require `roles.assign`. Public POST routes under
`/api/v1/invitations` provide inspect, verification request and acceptance. All writes
require the trusted Origin and JSON; acceptance can resolve an existing cookie actor.
The temporary invitation cookie uses the session cookie's secure/same-site policy.

There are no groups, SSO admission, account linking, directory
provisioning, permanent invitation-history cleanup or public self-signup endpoints.
An administrator can revoke an invitation or replace it with corrected roles; there
is no separate assignment editor. UI integration remains pending.

## Verification and source

PGlite and disposable PostgreSQL exercise real repositories/workflows: one-use
acceptance, concurrent identity reuse, audit/outbox rollback, replacement, expiry,
failed attempts, account mismatch, suspension/readmission, tenant scoping, stale
inviter authority, retired roles, current policy and cross-purpose proof rejection.
HTTP tests cover the typed client, cookie binding, credential-free responses and
resulting organization access. The built-server smoke test follows real console
worker delivery through invitation and code acceptance. Renderer tests verify
escaping of untrusted names.

- [Protocol](../../packages/protocol/src/dto/organization/invitation.ts)
- [Tables](../../packages/database/src/schema/organization/invitation.ts)
- [Repository](../../packages/database/src/repositories/organization/invitation.ts)
- [Application](../../packages/application/src/organization/invitation)
- [Management contract](../../packages/api/src/groups/organization-invitations.ts)
- [Acceptance handlers](../../apps/server/src/http/routes/auth/invitations.ts)
- [Application tests](../../packages/application/tests/integration/organization/invitations.test.ts)

For [required SSO](required-sso.md), acceptance returns `nextAction: "authenticate_with_sso"`.
The member and assignments exist, but organization access remains blocked until explicit linking
and suitable approved provider authentication. Optional-policy acceptance returns `continue`;
current policy still controls whether the issued session can access organization resources.
