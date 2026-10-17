# Preface

Open-source, self-hosted knowledge infrastructure built with TypeScript and Effect.

This repository contains monorepo tooling and these workspace packages and applications:

- [protocol](packages/protocol/README.md): runtime-neutral shared Effect schemas, models and errors.
- [database](packages/database/README.md): Node.js persistence with Effect and Drizzle ORM/Kit.
- [application](packages/application/README.md): transactional instance setup, email sign-in, sessions and organization administration.
- [api](packages/api/README.md): shared Effect HTTP contract and typed client metadata.
- [emails](packages/emails/README.md): typed durable email jobs and provider adapters;
  operational setup/sign-in rendering and scoped delivery.
- [server](apps/server/README.md): migration-gated backend, setup/session HTTP and operator CLI.
- [template](packages/template/README.md): reusable starter for internal packages.
- [ui](packages/ui/README.md): the design system - Base UI components in the shadcn/ui structure, Preface tokens,
  icons, company logos and brand marks.
- [dashboard](apps/dashboard/README.md): the Preface dashboard on TanStack Router; onboarding and the empty organization home, UI only for now.
- [landing](apps/landing/README.md): preface.run, the landing page, on TanStack Start for Vercel.
- [uikit](apps/uikit/README.md): Preface UI Kit, the living reference for every component, icon, logo and piece of art in light and dark.

The database package includes connection/transaction services, error mapping, migration tooling,
PGlite/PostgreSQL test layers, and instance, auth and audit tables/repositories grouped in PostgreSQL
schemas. Protocol provides storage models, public bootstrap/session contracts and branded identities.
Application implements first-owner setup, browser-bound email code/link sign-in, sessions and
organization creation, membership, roles and ownership. The server wires
startup preparation, operator links, HTTP handlers, always-available Scalar/OpenAPI and Compose
on port 8080. The dashboard defaults to port 3000 and the landing page to port 4000. Backend-connected onboarding/sign-in UI, invitations, teams and SSO
remain subsequent features.

Start with the [architecture index](architecture/README.md) for system boundaries, contracts,
identity flows, storage, runtime and frontend ownership. The [server README](apps/server/README.md)
explains deployment configuration and starting the Compose stack.

## Setup

Use Node.js 24 (the exact development version is in `.node-version`) and pnpm 12.14.0, pinned in
`package.json`. Enable pnpm through Corepack, then install dependencies:

```sh
corepack enable pnpm
pnpm install
```

Installation enables Lefthook's Git hooks. Dependencies shared by multiple workspace packages use
the default catalog in `pnpm-workspace.yaml` through `catalog:`. Dependencies used by only one
package keep their versions in that package's manifest. Catalog mode is `manual` so new package-local
dependencies are not automatically added to the catalog. Workspace packages live under
`apps/*` and `packages/*`. Copy `packages/template` to start an internal package; its README covers setup and
source-first development with the `preface-source` condition.

## Commands

| Command             | Purpose                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm check`        | Check formatting, lint root configuration, typecheck it with TypeScript 7, and run workspace checks/builds |
| `pnpm check:root`   | Check formatting, lint and typecheck root tooling without workspace tasks                                  |
| `pnpm format`       | Format tracked and unignored files with Oxfmt                                                              |
| `pnpm format:check` | Check formatting without writing changes                                                                   |
| `pnpm lint`         | Run Oxlint, then workspace lint tasks                                                                      |
| `pnpm lint:fix`     | Apply Oxlint fixes                                                                                         |
| `pnpm typecheck`    | Check root TypeScript configuration files, then workspace typechecks                                       |
| `pnpm build`        | Run workspace builds through Turborepo                                                                     |
| `pnpm test`         | Run workspace tests through Turborepo                                                                      |
| `pnpm dev`          | Run workspace development tasks through Turborepo                                                          |

Workspace checks and builds run across the workspace. Database tests cover configuration,
error mapping, transactions and migrations with PGlite; an opt-in PostgreSQL lane verifies the
real driver and migration locking. Application tests exercise bootstrap concurrency and proof
lifecycle, audit rollback, session lifecycle and security adapters. See the
[database README](packages/database/README.md) and [application README](packages/application/README.md).
Klarity supplies the strict TypeScript, tsdown, Oxlint, Oxfmt, Conventional Commit and Lefthook presets.
Each package should choose its own environment-appropriate Klarity TypeScript preset; the root config
checks root and workspace tooling files only.

Pre-commit hooks format staged files and lint staged JavaScript/TypeScript. Commit messages must use
Conventional Commits, for example `chore: bootstrap repository tooling`. Pre-push runs root checks
alongside Klarity's workspace lint, typecheck and test tasks. GitHub Actions installs the frozen
lockfile under the pinned Node version, runs `pnpm check`, then runs `pnpm test`.

## VS Code

Install the workspace's recommended extensions for Oxc, TypeScript 7 and YAML. Shared
settings enable Oxfmt formatting and safe Oxlint fixes on save, and point the native TypeScript
language server at the installed TypeScript 7 package. Tool configuration discovery stays enabled so
future package-local overrides work. The CLI and GitHub Actions remain the authoritative checks.

## Effect guidance

Effect 4 is installed as a root development dependency so its version-matched guidance and source are
available before application implementation. Read `node_modules/effect/AGENTS.md` and its relevant
`ai-docs` examples before writing Effect code. Future workspaces that use Effect must declare their
own dependency through `catalog:`; the root installation does not replace package-owned dependencies.

Local research, populated environment files, dependencies and generated artifacts remain Git-ignored.
Sanitized `.env.example` and `.env.*.example` files may be committed.
