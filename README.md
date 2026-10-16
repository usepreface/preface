# Preface

Open-source, self-hosted knowledge infrastructure built with TypeScript and Effect.

This repository contains monorepo tooling and the first internal package scaffolds:

- [protocol](packages/protocol/README.md): runtime-neutral shared Effect schemas, models and errors.
- [database](packages/database/README.md): Node.js persistence with Effect and Drizzle ORM/Kit.
- [template](packages/template/README.md): reusable starter for internal packages.

Domain contracts, persistence features and applications have not been implemented yet.

## Setup

Use Node.js 24 (the exact development version is in `.node-version`) and pnpm 11.28.6, pinned in
`package.json`. Enable pnpm through Corepack, then install dependencies:

```sh
corepack enable pnpm
pnpm install
```

Installation enables Lefthook's Git hooks. Dependency versions live in the default catalog in
`pnpm-workspace.yaml`; package manifests reference them with `catalog:`. Workspace packages live under
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

Workspace checks and builds run against all three packages; there are no automated tests yet.
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
