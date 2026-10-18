# Authentication and organization audit access

Business workflows append typed audit events in the same transaction as their state changes.
Audit history exposes those verified records through two distinct authorization scopes.
`Application.audit.list/exportCsv` owns authorization and public pagination; the repository
owns SQL filters and chronological cursor queries. Neither boundary exposes arbitrary logs.

Organization reads require current acceptable organization authentication, active membership and
`audit.read`. Built-in owners/administrators have this permission; ordinary members do not.
Custom roles can delegate it under existing permission rules. Every query includes the exact
organization ID, including cursor and export requests.

Instance history requires current instance ownership and recent local email. It includes
bootstrap/instance events, installation Google connection administration, and operator domain
approval/withdrawal decisions. The last category may carry the reviewed organization/domain ID;
it does not grant the operator access to that organization's remaining history. Unrelated global
user sessions, profiles, account links and private organization events are excluded.

API routes under `/api/v1` are organization `/audit-events` and `/audit-events/export`, and
instance `/instance/audit-events` and `/instance/audit-events/export`. Lists default to 25 and
cap at 100. Optional filters are event type, actor user, target ID and inclusive time bounds.
Cursor JSON contains the exact occurred-at timestamp and UUID; the query orders by both
descending and applies an exclusive cursor. A cursor cannot change authorization scope.

Exports return `{ contentType: "text/csv", filename, content, nextCursor }`, with at most
1,000 records per request. A non-null cursor explicitly continues the export. Values are quoted
and escaped, with formula-like leading characters neutralized. Downloads require the same
authorization as reads; no public object-store URL or separate credential is created.

Persistence decoding validates each event-specific metadata schema before public projection.
Existing payloads contain typed IDs, decisions, bounded presentation and permission context,
not credentials, tokens, provider assertions or email bodies. New events must preserve this
property. Bounded exports avoid an unrequested durable export worker; automatic retention,
destructive cleanup and external SIEM streaming are not implemented.

Real-repository tests cover timestamp-tie pagination, organization isolation, instance-history
separation, permission denial and scoped export. Required audit failure/rollback remains tested
with the state-changing workflows themselves.

## Source

- [Audit models](../../packages/protocol/src/model/audit/event.ts)
- [Public DTOs](../../packages/protocol/src/dto/audit/event.ts)
- [Queries](../../packages/database/src/repositories/audit/event.ts)
- [Workflows](../../packages/application/src/audit/history.ts)
- [HTTP contracts](../../packages/api/src/groups/audit.ts)
- [HTTP handlers](../../apps/server/src/http/routes/audit/history.ts)
- [Regression](../../packages/application/tests/integration/organization/audit.test.ts)
