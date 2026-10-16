# @usepreface/database

Node.js persistence package for Preface. Owns Drizzle table definitions, database schemas, relations,
generated migrations and repositories. Shared contracts belong in [protocol](../protocol/README.md);
business workflows and transport policy belong in their application packages.

This is package scaffolding with a placeholder export. Effect and Drizzle ORM are runtime
dependencies; Drizzle Kit is a development dependency. ORM and Kit use matching, exact release
candidate versions in the workspace catalog for the Effect integration.

`patches/drizzle-orm@1.0.0-rc.4.patch` replaces the removed Effect
`Schema.TaggedErrorClass` API with `Schema.TaggedError` in Drizzle's ESM and CommonJS
runtime error definitions. This fixes importing the Effect drivers with Effect 4.0.5;
review and remove the patch when upgrading to an upstream release with this fix.

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
