# Organization authority

An enabled instance owner can create an organization. Creation explicitly admits
them as a member and grants the organization's protected owner role. Instance
ownership and creator attribution grant no access to other organizations. Users
keep their installation-wide identity and session across organizations.

## Storage and contracts

The `organization` PostgreSQL schema contains its authority tables, plus invitation tables documented in
[invitation admission](invitations.md):

- `organization`: UUIDv7 identity, versioned metadata, unique normalized slug, creating user,
  archive state and timestamps.
- `member`: stable organization/user relationship, original join time, suspension,
  removal and timestamps. The organization/user pair is unique.
- `role`: organization-local scope/key, name, builtin/custom kind, code-owned permission
  keys, archive state and timestamps. Keys remain reserved after retirement.
- `role_binding`: direct member grant, role, granting member, time and revocation.
  Separate partial indexes admit one active grant per member/role at each organization or team scope.
  Team grants additionally reference a same-organization direct team membership.
- `auth_policy`: one policy per organization, positive revision, configured login methods,
  optional/required SSO mode, provider authentication age, updating member and timestamps.

Composite foreign keys include organization identity for roles, members, granting
members and policy updaters. All referenced history uses restrictive deletion.
`audit.event.organizationId` is nullable for global events and required by the typed
organization event variants. Audit rows record final state or grant/transfer context;
credentials and arbitrary request bodies are never metadata.

Protocol identifiers use `createBrandedId`. Shared validation/normalization lives in
focused `common/` modules. Persistence codecs and public DTOs remain separate.
Drizzle relation parts belong to their domain files and are composed after the
schema-wide empty part, preserving inference for tables without explicit relations.

## Authorization and discovery

`OrganizationAccess` is an internal application service. It checks a current usable
session, enabled user, usable authentication evidence, active membership, organization state,
current policy and active role bindings. Mutations check again after obtaining the
organization lock. Roles and permissions are never cached in a session or accepted
from request bodies. Handlers supply the cookie-authenticated actor.

Unknown, removed and suspended memberships produce `ORGANIZATION_NOT_FOUND`,
including for instance owners. A known member of an archived organization receives
`ORGANIZATION_ARCHIVED`. Insufficient permission produces `FORBIDDEN`; insufficient
organization authentication evidence produces `AUTHENTICATION_REQUIRED`.

The default policy accepts email code and email link authentication. Bootstrap
email-code evidence counts as email-code authentication. The policy is enforced on
access; owners can additionally opt into Google through the revision-checked policy editor. Both email
methods remain enabled. [Google identity](google.md) owns configuration and evidence semantics.

`GET /api/v1/organizations` is membership discovery, not content authorization.
It returns active memberships' organization summaries, ordered by UUIDv7 ID descending,
with an exclusive cursor, default page size 25 and maximum 100. Archived organizations
are omitted unless `includeArchived=true`, and then appear only for their owners.
`GET /api/v1/instance/capabilities` reports current organization-creation authority.
A selected organization is a route selector; no session selection column is needed.

## Creation and organization lifecycle

Creation locks installation to coordinate with instance-owner mutations, rechecks
actor/owner authority, then writes organization, creator membership, built-in roles,
explicit owner binding, default auth policy and required audit in one transaction.
Only the named slug uniqueness conflict becomes `SLUG_UNAVAILABLE`. Failed audit
rolls back all creation rows. Concurrent attempts for the same slug admit one winner.

Metadata and slug updates require `organization.update`. Archive and restore require
explicit organization ownership. Archive blocks ordinary access without removing
members or grants. Restore has an explicit archived-owner authorization path;
ordinary operations cannot opt out of archive checks. Repeated archive/restore
calls retain state without appending another transition event.

## Roles and delegation

Built-ins are owner, administrator and member. Their definitions are code-owned
and seeded per organization, together with team administrator/member definitions. Owner has all organization permissions; administrator has
all except `organization.archive`; member has organization/member/role/team-directory read access. Team grants never contribute
to organization permissions; see [teams and profiles](teams-profiles.md).
The owner role is additionally recognized as a protected authority, not something
custom permission strings can manufacture.

The current vocabulary is `organization.read`, `organization.update`,
`organization.archive`, `members.read`, `members.manage`, `roles.read`,
`roles.manage`, `roles.assign`, `teams.read` and `teams.manage`. Custom-role permissions must fit the actor's
current delegation envelope and cannot include archiving. Editing/retiring a role
also requires authority over its existing permissions, preventing takeover of a
more powerful custom role. Built-ins cannot be edited or retired.

Generic role assignment requires `roles.assign`, an active enabled target member,
a same-organization active role and delegable permissions. It cannot assign/revoke
the owner role or let a non-owner change an owner's direct assignments. Repeated
grants return the existing binding without duplicating audit. Retiring a custom
role revokes its active bindings and appends required audit atomically. Permission
changes affect subsequent requests immediately through current-state checks.

## Membership and ownership lifecycle

Suspension blocks organization access while retaining assignments for authorized
reinstatement. Removal and leaving remove direct team memberships and revoke all organization/team role bindings transactionally;
clearing lifecycle state alone cannot resurrect those grants. Removed memberships
cannot be reinstated through the suspension endpoint. Organization removal does
not revoke installation-wide sessions or authority in other organizations.

Organization-owner grants/revocations and transfers use dedicated owner-only
workflows. A recovery owner requires an active membership, enabled identity and
verified login-enabled email path; they do not need a currently active session.
Removing, suspending, leaving or revoking an owner requires another usable owner.
The common organization lock serializes these changes, including competing owner
departures. Non-owners cannot manage owner memberships through ordinary admin APIs.

Transfer grants the target ownership, grants the source administrator, revokes
source ownership and appends transfer audit in one ambient transaction. Nested
workflow calls join that transaction. Required audit failure rolls back target
grants and source demotion together. Transferring to oneself is an authorized no-op.

Read requests have an authority-check point; revocation cannot recall a response
already being delivered. Mutation workflows serialize organization authority changes.
A future global user-disable workflow must coordinate with affected organizations'
last-usable-owner invariant; this phase provides no account-disable endpoint.

## HTTP and limits

The shared HTTP contract provides create/list/detail/access/update/archive/restore,
member list/suspend/reinstate/remove/leave, custom role CRUD, direct role bindings,
owner grants/revocations/transfer, policy reading and owner-controlled Google opt-in. Member and role lists are
cursor-paginated; removed members/retired roles are explicitly opt-in.

All endpoints use the existing session cookie. Mutations require the trusted Origin;
POST/PUT/PATCH bodies are JSON, including `{}` for bodyless action payloads. CORS
permits PUT/PATCH. Public responses select safe fields and encode dates as ISO
strings. Logs normalize parameterized routes rather than retaining tenant IDs.

There is no public direct-member-creation endpoint. Organization creation admits
its first member; [invitations](invitations.md) own additional admission and readmission.
Authority tests can seed members through persistence fixtures; invitation tests
exercise the actual admission workflow. [Teams](teams-profiles.md) use direct memberships without groups. Permanent deletion, organization content and dashboard integration
are outside this implemented phase.

## Verification and source

PGlite tests cover creation rollback, instance-owner isolation, policy/evidence,
archiving, delegation, cross-organization references, membership lifecycle and
ownership. Disposable PostgreSQL runs the same scenarios to verify locking and
competing owner departures. HTTP tests use the typed client against real migrated
repositories and cover JSON mutations, cookie authentication, CORS and management.

- [Protocol schemas](../../packages/protocol/src/model/organization)
- [Storage schema](../../packages/database/src/schema/organization)
- [Repositories](../../packages/database/src/repositories/organization)
- [Access checks](../../packages/application/src/organization/access.ts)
- [Application workflows](../../packages/application/src/organization)
- [HTTP contracts](../../packages/api/src/groups/organizations.ts)
- [HTTP handlers](../../apps/server/src/http/routes/organizations.ts)
- [Application tests](../../packages/application/tests/integration/organization)
- [HTTP tests](../../apps/server/tests/integration/http/organizations.test.ts)

Organization owners can approve optional [OIDC connections](oidc.md) through the existing revisioned
policy editor. The connection relation enforces same-organization ownership. Email remains available for global login;
[required SSO and owner recovery](required-sso.md) add enforced provider freshness. Every organization/team access checks exact accepted
evidence, and method discovery remains available to active members before satisfying that policy.
