# The installation organization

Each Preface installation represents one organization. Installation verification
creates it; no public route creates, lists, selects, archives or restores organizations.
An organization retains its UUID, versioned metadata, creation attribution and
lifecycle timestamps. It has no routing slug or archive state.

## Initialization and persistence

`organization.organization.installation_id` is fixed to 1, references the installation
and has a unique index. This enforces at most one organization independently of the
application. Bootstrap owns the installation lock and initializes the organization,
owner membership, three built-in organization roles, two team roles, owner binding
and default authentication policy in its completion transaction. Required audits,
verified user/email, operator grant, session and setup-proof consumption commit with
those writes. Failure leaves installation unfinished; concurrent completion admits
one winner. See [instance setup](instance-setup.md).

Organization IDs remain on memberships, roles, teams, invitations and connections.
Foreign keys and explicit query scopes still express ownership even though the
product has one organization. The repository exposes `find`, `findById`, `lockById`,
`create` and `update`; creation is internal to installation initialization.

## Identity and authority

Instance operator grants and organization memberships are separate. Bootstrap
explicitly gives the first user both. A later operator grant alone does not grant
organization content. Organization access requires a usable actor, active membership,
accepted authentication evidence and the operation's permissions. Mutations recheck
authority after acquiring their organization lock.

Members can be invited, suspended, removed or readmitted. Roles remain scoped to the
organization or an individual team. Last-owner and required-SSO recovery protections
remain enforced. Team and custom-role archival are independent of the removed
organization lifecycle. [Invitations](invitations.md), [teams](teams-profiles.md) and
[required SSO](required-sso.md) describe those boundaries.

Administrative actions do not require a separate recent-email proof. Existing
verified account eligibility, current roles, session revocation, provider trust and
required-SSO policy still apply. Identity linking remains browser/session-bound;
removing the five-minute step-up does not authorize account transfers or user merging.

## HTTP and dashboard

`GET/PATCH /api/v1/organization` reads or updates the organization. The server resolves
its ID and passes it to existing domain workflows; callers cannot select another
organization. Members, teams, roles, invitations, domains, policy and identity
connections use the `/api/v1/organization` prefix with their own resource IDs.
`GET /api/v1/auth/access` reports the current member's authentication requirements
without authorizing content or changing a selected organization.

The dashboard opens at `/`, settings at `/settings/*`, and owner recovery at
`/auth-recovery`. A pathless application layout retains the sidebar during navigation.
There is no picker, switcher, organization URL editor or additional-organization page.

## Verification

Application and HTTP tests cover initialization, permissions, ownership, suspension,
audit rollback and stale actors. Setup tests assert organization initialization and
rollback alongside identity. PostgreSQL exercises locks and competing invitation
completion. Browser journeys exercise installation directly into the dashboard,
member admission, settings and enterprise authentication.

## Source

- [Organization table](../../packages/database/src/schema/organization/organization.ts)
- [Initialization](../../packages/application/src/organization/initialize.ts)
- [Access checks](../../packages/application/src/organization/access.ts)
- [HTTP resolution](../../apps/server/src/http/organization.ts)
- [HTTP contract](../../packages/api/src/groups/organization/organizations.ts)
- [Dashboard layout](../../apps/dashboard/src/routes/_app.tsx)
