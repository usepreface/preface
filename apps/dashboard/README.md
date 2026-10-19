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

- `/setup`, `/setup/verify`: organization name, owner name and email, followed by
  code verification. Completion opens the dashboard with the sole organization ready.
- `/sign-in`, `/sign-in/verify`: enabled Google/OIDC/SAML methods are shown immediately;
  email code/link sign-in does not require organization discovery or slug entry.
- `/invitations/accept`: inspect an invitation and join through email or an approved
  provider. `/auth/verify-email` handles additional mailbox proof when required.
- `/`: organization dashboard. `/settings/general`, `/settings/members`,
  `/settings/teams`, `/settings/roles`, `/settings/authentication`, `/settings/google`,
  `/settings/connections`, `/settings/domains` and `/settings/audit` provide administration.
- `/account/profile`, `/account/security`: personal metadata, linked accounts and sessions.
- `/auth-recovery`: explicit owner recovery using an offline credential.
- `/instance`: operator overview, exact domain-review links and installation audit.

There is no organization picker, switcher, additional-organization creation, routing
slug or organization archival. Current owner sessions can manage settings without a
five-minute email step-up. Required SSO, membership, role and recovery checks remain.
Image uploads, knowledge ingestion and AI features are not implemented.

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
