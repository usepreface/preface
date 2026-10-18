# Dashboard

The dashboard is a Vite SPA using TanStack Router file routes, React Hook Form,
Effect schemas and Effect Atom. It consumes the browser-safe `PrefaceApi` contract;
no database/application services or server secrets enter the bundle. Presentation
uses the shared UI package. API handlers retain all authorization and business rules.

## HTTP and state ownership

One `AtomHttpApi.Service` supplies credentialed fetch and the generated client.
Domain atoms own request identity and explicit reactivity tags; domain hooks expose
queries and mutations. Request parameters include pagination, scope and filters.
Invalidation tags are independent memberships, not hierarchical prefixes. The
registry's idle retention is not a freshness interval.

Each router owns one registry, passed to both loaders and React. Required loaders
await the same atoms that components read, with route cancellation. Slug routes
resolve only against the actor's paginated organization directory, then freshly
check authentication requirements and organization access. An instance-owner grant
never bypasses membership. Lists expose cursor controls; assignment/invitation
choices collect both role scopes and all relevant pages, rejecting repeated cursors.

The shell contains route suspension inside its main panel, keeping its top bar and
sidebar mounted during page-code loading. Route pending states and query boundaries
render accessible skeletons only around unresolved content. The router reveals pending
UI after 150 ms without a minimum display time; successful query data stays visible
during background refresh. Initial session/organization checks still gate protected
rendering, and confirmed access changes still clear the protected cache.

A mutation hook creates its own runtime function atom, preventing independent
forms from interrupting each other. It blocks duplicate submissions, reports safe
public errors, invalidates only after backend success and drops late results after
unmount. Successful 204 responses have an explicit success result. Ordered bulk
invitations/membership/role changes stop on failure and retain successful changes;
they are individual backend transactions, not a client-side atomic batch. Partial
results remain visible through refreshed queries. Grants precede revocations.

Plain request objects omit undefined properties before generated encoding because
`Schema.optionalKey` accepts omission rather than a present undefined property.
The normalizer preserves Effect values such as decoded timestamps. Provider starts
navigate to backend-produced authorization URLs. Completion destinations are checked
against the dashboard origin; API/session credentials travel only through cookies.

## Authority and refresh

Only `AuthenticationError/UNAUTHENTICATED` becomes a signed-out session. Network,
provider, decode and server errors do not imply logout. Query failures render safe
retry states, and access failures never display a retained successful response.
An unauthorized resource read also revalidates the current session.

Focus refresh has one subscription per distinct mounted atom in the router registry.
Session, organization policy/access and team access also refresh while visible every
30 seconds. Navigation freshly checks session and organization authority. Permission
checks control page/operation rendering; they supplement the backend checks.

A confirmed session, organization membership/permission or team-authority change
stops protected rendering and resets cached state. Resetting the registry destroys
its subscriptions, so the registry provider remounts all consumers with a new React
generation before loading again. The router and its registry reference stay shared.
Explicit login/logout/accepted-invitation transitions use this same boundary. Dirty
profile edits do not reset on presentation-only refresh; patches include edited
fields, and security configuration forms retain their loaded revision for conflict
checking. One-time credentials live only in the active issuance dialog.

## Forms and proof flows

Form schemas derive from protocol inputs. The Standard Schema resolver validates
raw form values, then the form adapter decodes after React Hook Form's submission
clone. This preserves identity-backed Effect values such as `Redacted`, whose
WeakMap state cannot survive cloning. Secret values are unwrapped only into typed
HTTP request fields. Server inputs immediately redact them again. Forms never log
validation payloads or client causes.

Operator setup, invitation and email-link proofs enter through fragments, which
are removed from history when captured. In-memory atoms retain multi-page setup and
email challenges; refreshing a transient code screen requires restarting the
request or reopening its original link. Code screens use server expiry/cooldown
values. Proof acceptance is an explicit submission, avoiding mount-time replay.
Email/browser binding, expiry and single consumption remain server responsibilities.

Setup creates the owner session, then permits first-organization creation or a later
return. First-organization creation shows a completion summary from the successful
API response; opening the organization or its members page is an explicit navigation.
That summary remains in component memory and is not an additional setup authority.
Invitations support email code/link acceptance and first-time Google/OIDC/SAML
enrollment. External callbacks can redirect into `/auth/verify-email`; that page
requests/verifies a browser-bound code or resumes a verified flow before continuing.
Required organization SSO renders an authentication gate, with explicit account
linking/confirmation and a separate owner recovery route. Email login alone cannot
open a required-SSO organization, including for an owner.

## Administration

Organization pages connect membership lifecycle, roles, ownership, invitations,
direct teams, metadata patches and archival. Active role-binding reads supply exact
revocation identities at organization/team scope. Owners configure/test/activate
OIDC/SAML, approve policy connections, bind verified domains, inspect connection
health and manage staged SAML signing keys. Instance Google configuration follows
its separate owner/test/activation boundary.

Recovery issuance displays the credential once and clears it on close; redemption
uses the owner's current policy revision and recent email proof independently of
SSO. The backend consumes it and changes policy atomically. Audit pages filter,
paginate, inspect safe events and download bounded CSV pages, including continuation.
Instance audit/domain decisions remain separate from organization access. Unsupported
knowledge, image-upload and global-directory actions are not simulated by the UI.

## Runtime and verification

Development uses port 3000 and proxies `/api` to localhost:8080. Production serves
`dist/` with an SPA fallback and either an API reverse proxy or a public
`VITE_API_URL` build-time origin. `DASHBOARD_URL` configures backend links/redirects;
`PUBLIC_URL` configures provider callbacks. Same-site HTTPS is required in deployment.
The backend/Compose image does not serve dashboard assets.

`pnpm test:dashboard` uses the built SPA and real backend, disposable PostgreSQL,
SMTP/Mailpit and Keycloak. Its test build excludes environment-file and shell
`VITE_*` overrides. Browser cases exercise onboarding, returning operators,
invitation admission with scoped roles, OIDC/SAML configuration, required-SSO
recovery, domain approval, audit export, dirty form preservation, shared query
reuse and session-cache rejection. The backend provider/security suites remain separate. These tests do not
certify hosted Google/Okta/Entra configurations or unsupported provider profiles.

## Source

- [Client and atoms](../../apps/dashboard/src/atoms)
- [React adapters](../../apps/dashboard/src/hooks)
- [Router registry](../../apps/dashboard/src/router.tsx)
- [Registry reset boundary](../../apps/dashboard/src/components/api/registry-provider.tsx)
- [Form boundary](../../apps/dashboard/src/lib/forms/use-schema-form.ts)
- [Routes](../../apps/dashboard/src/routes)
- [Dashboard browser journeys](../../tests/e2e/dashboard)
- [Disposable static/proxy fixture](../../tests/e2e/fixtures/dashboard.ts)
