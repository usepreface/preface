# @usepreface/template

Private starter for internal workspace packages, kept in `packages/template` for copying into new packages.
Uses Klarity's strict Node.js TypeScript preset and tsdown for unbundled ESM, declarations and source
maps. Replace the placeholder source export with the new package's public exports.

## Create a package

From the repository root, copy only the starter files so installed dependencies and build output
stay behind:

```sh
mkdir -p packages/new-package
cp packages/template/{package.json,tsconfig.json,tsdown.config.ts,README.md} packages/new-package/
cp -R packages/template/src packages/new-package/src
```

Rename `@usepreface/template` in the copied manifest, replace this README and add the package's
implementation. Declare runtime dependencies such as Effect in the owning package using `catalog:`;
the template itself has no runtime dependencies. Keep `private: true` unless publishing is intentional.

```sh
pnpm install
pnpm --filter @usepreface/new-package typecheck
pnpm --filter @usepreface/new-package lint
pnpm --filter @usepreface/new-package build
```

## Source development and builds

Workspace exports resolve directly to `src/` when the consumer enables the `preface-source` condition.
The TypeScript config already enables it. Configure future bundlers and test runners with the same
condition; for Node.js 24, pass `--conditions=preface-source`. Without it, imports resolve to `dist/`
and require a build. `pnpm dev` watches and rebuilds this package's output through tsdown.

Use `#/*` for internal imports, public package exports across workspaces, and `.js` extensions for
relative ESM imports. Add public entry points to `tsdown.config.ts`; tsdown updates manifest exports
when building. `publishConfig` removes development source exports from pnpm-packed artifacts, whose
code lives in `dist/`. The `prepack` script builds before packing; CI builds also run Publint to check
the package metadata and exported paths.
