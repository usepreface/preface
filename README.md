# Preface

Open-source, self-hosted knowledge infrastructure built with TypeScript and Effect.

This repository currently contains root tooling only. There are no applications or workspace packages.

## Setup

Use Node.js 24 (the exact development version is in `.node-version`) and pnpm 11.28.6, pinned in
`package.json`. Enable pnpm through Corepack, then install dependencies:

```sh
corepack enable pnpm
pnpm install
```

Installation enables Lefthook's Git hooks. Dependency versions live in the default catalog in
`pnpm-workspace.yaml`; package manifests reference them with `catalog:`. The workspace globs reserve
`apps/*` and `packages/*` for future work without creating placeholder directories.

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

Workspace tasks have nothing to execute until packages are added. No application build or tests exist
yet; root lint/typechecking still perform real checks. Klarity supplies the strict TypeScript,
Oxlint, Oxfmt, Conventional Commit and Lefthook presets. Each future package should choose its own
environment-appropriate Klarity TypeScript preset; the root config checks tooling files only.

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
