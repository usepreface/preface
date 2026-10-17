# Teams and versioned profiles

Teams are direct organizational units inside one organization. An organization member
can belong to multiple teams. There are no groups, implicit backing groups, nested teams
or directory-synchronization paths.

## Metadata boundary

`auth.user`, `organization.organization` and `organization.team` store typed JSONB metadata
with `version: 1`. User metadata contains required name and optional title, bio and image.
Organization/team metadata contains required name and optional description and logo.
Image/logo metadata is only an optional `{ type: "image", value: "https://…" }` presentation
reference. There is no upload, fetching, processing, storage, deletion worker or image-editing
endpoint. Roles retain their own names; instance settings retain their display name.

Protocol owns separate metadata schemas and reuses them in persistence and public DTOs.
Current decoders accept version 1 only; there is no legacy version to upgrade. New versions
need explicit decoding/migration decisions. JSONB checks enforce object/version/name, while
protocol codecs validate full metadata at repository boundaries. IDs, email, slugs, disabled,
archive and membership state remain relational and cannot be changed through metadata.

Create inputs accept name/description without a version. The application constructs the
current version. Patches merge with the locked current row; omitted fields survive and null
clears optional descriptive fields. Unknown fields are discarded by input schemas. User
profile GET/PATCH `/api/v1/users/me` checks the current actor; updates lock the user and commit
`auth.profile_updated` with the changed field names. Organization/team mutations use the
organization lock. Public sessions and member lists read current user metadata.

## Persistence and authority

`organization.team` stores organization, unique organization-local slug, metadata, creating
member, archive state and timestamps. `team_member` links one organization member to one
team, with admitting member, original join time, removal and lifecycle timestamps. Composite
foreign keys keep team, member and admitting actor in the same organization. Removing and
readmitting retains the stable membership ID and original join time.

Roles declare `scopeKind: organization | team`; keys are unique inside an organization/scope.
Organization creation seeds three organization roles and team administrator/member definitions.
Team role definitions are reusable across that organization's teams. Creating/editing/retiring
custom team definitions requires organization `roles.manage` and `teams.manage`. Definitions
cannot mix organization and team permission vocabularies. Built-ins remain protected.

Bindings carry scope and nullable team identity. SQL binds the role's organization/scope and
requires a direct team membership for team grants. Organization authority queries select only
bindings with no team. Team authority requires current organization membership/evidence,
an active team membership and unrevoked, unarchived grants for that exact team. Team grants
never confer organization authority or access to another team. Organization `teams.manage`
is an explicit administrative recovery capability over teams, not an implicit membership.

`TeamAccess` supplies these fresh checks. Mutations use the shared organization lock and
recheck session/membership/policy after waiting. Grant/revoke and member-removal operations
respect the actor's current delegation envelope. Organization role listing can filter scope;
the team role-list route requires `team.roles.read` and returns only team definitions.

## Lifecycle and admission

Organization `teams.read` exposes the team directory; `teams.manage` creates teams. Creation
writes team, creator membership, administrator grant and required audit in one transaction.
Team detail requires `team.read`, editing `team.update`, and archival `team.archive`.
Archival blocks normal team operations and invitation assignments while preserving history.
Repeated authorized archival is a no-op. There is no team restore or permanent deletion API.

Adding an active organization member requires `team.members.manage` and delegation of the
default team member permissions. Repeated addition preserves existing grants. Removal revokes
all of that member's grants in the selected team, with required audit in the same transaction.
Readmission grants the default role without resurrecting old administrator/custom roles.
Suspending organization membership blocks every team without discarding assignments; removal
or leaving marks all team memberships removed and revokes grants in every scope. The parent
organization lifecycle audit records that cascade.

[Invitations](invitations.md) can request direct team membership and scoped roles. Creation
resolves omitted team roles to the built-in member role and persists explicit assignments.
Acceptance rechecks team lifecycle, role lifecycle/permissions and original inviter authority
under the organization lock. All organization/team admission, scoped grants, identity/session,
proof consumption and audit commit together. An unavailable assignment fails the entire
acceptance; it is never silently dropped.

## Verification and limits

Application tests cover scope isolation, role-scope mismatch, removal/readmission, organization
removal cascades, cross-organization lookup, archival, required-audit rollback, metadata patch
preservation and clearing, revoked actors, atomic invitation admission and stale team assignments.
HTTP tests exercise typed profile/team payloads, role grants and public metadata codecs.
Disposable PostgreSQL additionally exercises shared organization locking and packaged startup.
No dashboard integration, images service, SSO or external directory provisioning is wired.

- [Metadata schemas](../../packages/protocol/src/metadata)
- [Team persistence](../../packages/database/src/schema/organization/team.ts)
- [Team queries](../../packages/database/src/repositories/organization/team.ts)
- [Team workflows](../../packages/application/src/organization/team)
- [Profile workflow](../../packages/application/src/profile/user.ts)
- [HTTP contracts](../../packages/api/src/groups/teams.ts)
- [Team tests](../../packages/application/tests/integration/organization/teams.test.ts)
