# @usepreface/dashboard

Preface's browser dashboard for instance setup, email and enterprise authentication,
organization administration, teams and account management. Requires Node.js 24,
pnpm 12.14.0 and the Preface backend.

## Run locally

Install workspace dependencies with `pnpm install`. From the root, run:

```sh
pnpm services:up
pnpm dev
```

This starts local PostgreSQL and Keycloak, then runs the backend, dashboard and
landing page. Generated defaults configure `PUBLIC_URL=http://localhost:8080`,
`DASHBOARD_URL=http://localhost:3000` and console email. Optional backend overrides
belong in `apps/server/.env`; see the [server README](../server/README.md).

Open the operator link printed by the backend to initialize an empty instance.
Development runs on port 3000 and proxies `/api` to localhost:8080. The browser
sends HttpOnly cookies; it never reads or stores session credentials.

The default client uses the dashboard origin. Set optional `VITE_API_URL` to the
backend **origin**, without `/api/v1`, when the browser must call it directly.
That public build-time value must contain no credentials. Configure the backend
with the exact dashboard origin and deploy both on the same site for SameSite
cookies. Email links and provider callbacks use `DASHBOARD_URL`; provider callback,
ACS and metadata URLs still come from the backend's `PUBLIC_URL`.

## Build and host

```sh
pnpm --filter @usepreface/dashboard build
pnpm --filter @usepreface/dashboard preview
```

Serve `dist/` with a static host and an `index.html` fallback for application routes.
For the default same-origin client, reverse proxy `/api` to the backend. Preserve
HTTPS and the original Origin header. The dashboard is a separate app; the backend
image does not serve its assets. `vite preview` is for checking a build locally.

Setup, invitation and email proofs are read from URL fragments and immediately
removed from browser history. They remain only in document memory. Reopening the
original email/operator link recovers a page after reload; a code request can be
restarted if its transient challenge screen was refreshed. No one-time proofs or
recovery credentials are written to local/session storage.

## Available workflows

- `/setup`, `/setup/verify`, `/setup/organization`: owner email verification and
  first organization, followed by a setup summary with links to open the organization
  or invite members. Setup can be completed before an organization is created.
- `/sign-in`, `/sign-in/verify`: email discovery, codes and available Google/OIDC/SAML
  methods. `/auth/email/verify` handles browser-bound email links.
- `/invitations/accept`: review an invitation, verify by code/link, or enroll directly
  through an approved provider. `/auth/verify-email` completes provider flows that
  need additional mailbox proof.
- `/organizations`, `/organizations/new`: membership-scoped organization selection,
  owner-only creation and restoration of archived organizations.
- `/org/:slug/settings`: organization details, members/invitations, scoped roles,
  teams, login policy, OIDC/SAML connections, domains and audit history/CSV export.
- `/org/:slug/auth-recovery`: owner-bound offline recovery without provider access.
- `/account/profile`, `/account/security`: profile patches, linked identities,
  provider confirmation and current/other/all-session revocation.
- `/instance`: owner-only overview, Google configuration, exact domain-claim review
  links and separate instance audit history.
- `/auth/reauthenticate`, `/auth/email/reauthenticate`: fresh local-email evidence
  for sensitive operations. Provider starts return through backend callbacks.

Image uploads, knowledge ingestion, AI features, global organization administration
and an instance-domain review queue are not provided by the current backend. Their
former sample records/actions are absent or disabled. Instance ownership never
supplies organization membership. The API remains authoritative for every action.

## Verification

```sh
pnpm --filter @usepreface/dashboard lint
pnpm --filter @usepreface/dashboard typecheck
pnpm test:dashboard
```

The root browser lane builds the real SPA with local environment-file loading
**disabled**, ignores shell `VITE_*` overrides and runs it against disposable PostgreSQL, Mailpit and Keycloak. It
requires Docker, OpenSSL and Chromium (`pnpm exec playwright install chromium`).
It does not use deployment databases, provider credentials or live inboxes.
See the [dashboard architecture](../../architecture/interfaces/dashboard.md) for
state ownership, cache resets, form encoding and verification boundaries.
