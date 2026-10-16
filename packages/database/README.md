# @usepreface/database

Node.js persistence package for Preface. Owns Drizzle table definitions, database schemas, relations,
generated migrations and repositories. Shared contracts belong in [protocol](../protocol/README.md);
business workflows and transport policy belong in their application packages.

This is package scaffolding with a placeholder export. Effect and Drizzle ORM are runtime
dependencies; Drizzle Kit is a development dependency. ORM and Kit use matching, exact release
candidate versions in the workspace catalog for the Effect integration.

Connection setup, the custom transaction layer, tables, repositories and migration configuration will
be added with the first persistence feature. No database connection or environment configuration is
required to check or build the scaffold.

## Development

From the repository root:

```sh
pnpm --filter @usepreface/database typecheck
pnpm --filter @usepreface/database lint
pnpm --filter @usepreface/database build
pnpm --filter @usepreface/database dev
```

Uses Klarity's Node.js TypeScript and tsdown presets, targeting Node.js 24. Builds emit unbundled ESM,
declarations and maps into `dist/`; watch mode rebuilds them. Consumers enable `preface-source` in
TypeScript and their runtime to resolve `src/` during development. Default exports resolve to built
output. See the [template](../template/README.md) for internal imports and packing conventions.
