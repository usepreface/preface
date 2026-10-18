# System model

Preface is self-hosted knowledge infrastructure with installation-wide identity
and multiple organizations as its product model. The implemented backend currently
supports installation preparation, first-owner setup, email code/link sign-in,
session resolution, session management, organization creation, membership lifecycle,
roles, ownership management, verified organization invitations, direct teams, versioned profiles, Google account linking/sign-in, organization-owned OIDC and SAML, domain authority, direct invitation SSO enrollment, verified implicit account linking, resumable proofs, discovery and optional/required organization authentication and owner-bound offline SSO recovery.
Setup verifies mailbox ownership through an encrypted email outbox, minimal renderer
and scoped worker. Image uploads and knowledge ingestion are not implemented. The landing page illustrates the product independently of
those backend capabilities.

## Ownership

| Boundary       | Owns                                                                              | Does not own                                            |
| -------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `protocol`     | Runtime schemas, IDs, reusable values, models, DTOs, inputs and expected errors   | I/O, business workflows or authority decisions          |
| `api`          | HTTP methods, paths, middleware declarations, status-specific schemas and OpenAPI | Handlers, repositories or runtime configuration         |
| `database`     | PostgreSQL schema, migrations, queries, transaction context and storage failures  | HTTP policy, password hashing or business authorization |
| `application`  | Business invariants, security capabilities, transactions and required audit       | Cookies, listener configuration or browser state        |
| `crypto`       | Credential primitives, purpose separation and authenticated encryption            | Business authority, persistence or HTTP                 |
| `emails`       | Typed email intent, encrypted payloads, delivery worker and provider adapters     | Credentials, recipients, business authority or HTTP     |
| `apps/server`  | Node implementations, configuration, startup, HTTP enforcement and operator CLI   | Query implementations or frontend rendering             |
| `ui`           | Shared presentation, controls, tokens, icons and artwork                          | Backend authority or application API calls              |
| `apps/landing` | Marketing page, metadata, demonstrations and browser interactions                 | Authenticated product workflows or persistence          |
| `apps/uikit`   | Interactive design-system reference                                               | Product state or backend behavior                       |

The dependency direction is `api → protocol`, `database → protocol`, and
`application → database + protocol + crypto + emails`. The server composes these packages and Node
security adapters. Frontends consume presentation and public contracts; they
never import database services. Runtime-neutral does not mean safe to expose every
field: persistence models still contain verification HMACs and credential digests.

## Identity and authority

Installation identity describes one deployment. User identity spans that deployment.
Instance-owner grants are separate from organization memberships. Being an
instance owner must not imply access to organization content.

Signup is invitation-only and only instance owners may create organizations. These
are fixed product rules, not configurable settings. The current setup proof is a
special authority to create the first owner, not a general signup invitation.
A resolved session identifies a usable user and session; it is not evidence of
an instance-owner grant or organization permissions. Organization workflows freshly
check membership, role bindings and acceptable evidence under the organization policy.

## Runtime and durable state

One server composition shares the PostgreSQL pool, transaction service,
repositories, migrations and application workflows. The listener opens only after
migrations and committed instance preparation. The Compose stack contains PostgreSQL and this backend, with an in-process email
worker and no dashboard.

Business state, durable email intent and required audit rows commit in one transaction.
Random credential generation happens outside SQL locks; delivery happens outside business transactions. One-time proof
consumption and owner changes use database coordination rather than process-local
locks. Request admission limits are process-local and serve a separate purpose.

Detailed workflows belong to [instance setup](identity-access/instance-setup.md)
[email sign-in](identity-access/email-sign-in.md) and [sessions](identity-access/sessions.md); [email](integrations/email.md) owns
durable external delivery infrastructure. Persistence consistency belongs to
[storage](data/storage.md). Logs summarize safe operational decisions. Audit rows
record durable product events. Metrics and remote telemetry exporters are not
currently wired.

## Source

- [Protocol exports](../packages/protocol/src/index.ts)
- [Application aggregate](../packages/application/src/index.ts)
- [Server composition](../apps/server/src/runtime.ts)
- [Compose stack](../compose.yaml)
- [Landing composition](../apps/landing/src/routes/-home/home-page.tsx)
