# Preface repository guide

Preface is self-hosted knowledge infrastructure with installation-wide identity
and multiple organizations. This repository is a pnpm/Turborepo TypeScript
monorepo targeting Node.js 24 and using Effect v4.

Signup is invitation-only. Only instance owners may create organizations.
Instance ownership and organization membership are separate authorities; being
an instance owner does not automatically grant access to organization content.
Neither signup nor organization creation policy is a configurable setting.

## Working sequence

1. Inspect the branch, working tree, and recent commits. Preserve existing work
   and keep unrelated changes in separate commits.
2. Read the owning package README and relevant architecture document, then trace
   the implementation and its callers. When documentation disagrees with code,
   verify the behavior in source and tests before making a change.
3. Make one coherent change at a time. Preserve public contracts and security
   boundaries unless the request explicitly changes them.
4. Run focused checks and existing regression tests. Run `pnpm check` for
   cross-package changes; report skipped checks and existing failures accurately.
5. Inspect the diff, including generated files, then commit with a short
   Conventional Commit message. Do not include local research or temporary files.

Explicit user instructions override the default commit workflow. When asked not
to commit, leave all work uncommitted until the user authorizes it. Preserve
concurrent work by other contributors and do not edit their files outside the
requested scope.

Do not rotate credentials, change production data, send live emails, or rewrite
Git history as a side effect of a refactor.

## Readability and module design

- Keep each module responsible for one domain or workflow. Split substantial
  screens into rendering, state, and domain sections when those boundaries are
  useful; do not split files just to meet a line count. Roughly 300–500 lines is
  a review prompt, not a hard limit. Schemas and declarative data can be larger.
- Reuse a helper when it has multiple callers, represents a domain invariant,
  or makes a workflow materially clearer. Keep simple one-off logic inline.
- Construct expected errors where the failure is detected. Avoid tiny `fail`
  wrappers that only hide an error constructor. Keep real error translation at
  provider and transport boundaries, and preserve public result APIs.
- Use names that explain the domain. Avoid catch-all `helpers.ts`, `common.ts`,
  or new utility layers when a focused module name describes the responsibility.
- Separate setup, validation, external calls, transactions, and result mapping
  with logical blank lines. Comments explain constraints and reasoning, not syntax.
- Preserve explicit authority checks around external operations. Sharing a
  credential loader must not cache credentials or remove fresh revocation checks.
- Remove obsolete runtime jobs and their callers after retirement is confirmed.
  Do not delete historical database migrations just because they already ran.
- Keep dependencies in the package that imports them. Prefer existing platform
  APIs and dependencies over adding another library for a small abstraction.

## Package map

- [`packages/protocol`](packages/protocol/README.md) — runtime-neutral Effect
  schemas, persistence models, branded IDs, and typed errors. Sensitive storage
  models are separate from public request/response DTOs.
- [`packages/database`](packages/database/README.md) — Drizzle schema,
  PostgreSQL layer, transactions, migrations, repositories, and test database
  layers. Tables are grouped into PostgreSQL schemas by domain.
- [`packages/application`](packages/application/README.md) — instance bootstrap,
  session workflows, security capabilities and Node security adapters. HTTP
  handling and runtime startup belong to the server boundary.
- [`packages/api`](packages/api/README.md) — runtime-neutral Effect HTTP contracts,
  middleware declarations and OpenAPI metadata, shared by server and clients.
- [`packages/emails`](packages/emails/README.md) — typed email jobs, encrypted
  outbox, renderer capability, provider adapters and scoped delivery worker.
  Templates are supplied separately; workflows enqueue inside their transaction.
- [`apps/server`](apps/server/README.md) — Node runtime composition, HTTP handlers,
  request policy, startup preparation, health/reference routes and operator CLI.
- [`apps/landing`](apps/landing/README.md) — public marketing page and prerendering.
  Page sections/components stay beside their route; shared site layout and motion
  hooks live at the app boundary. Development defaults to port 4000.
- [`packages/ui`](packages/ui/README.md) — shared presentation, tokens, controls,
  artwork and icons. [`apps/uikit`](apps/uikit/README.md) is its interactive reference.
- [`packages/template`](packages/template/README.md) — starter for new workspace
  packages.

Read the relevant package README before changing that package. Discover current
apps and packages from the workspace instead of assuming a proposed package
already exists. Do not create empty packages to match this guide.

Publishable package READMEs are for package users, not internal contributors.
Start with a clear description and requirements, include installation commands,
then runnable quick-start and practical usage examples. Explain authentication,
configuration, and important safety limits where relevant. Use absolute
documentation links that work on npm. Keep internal folder inventories and
contributor rules in architecture documents or this guide. Verify code examples
against current public exports and keep them synchronized with releases.

## Public docs writing style

Apply these conventions to public documentation when it is introduced.

- Write for humans first, with explicit names and context that also help AI
  agents. Use short sentences, direct instructions, and only the information
  needed for the current task. Avoid filler, implementation trivia, repeated
  caveats, and explanations of obvious language features.
- Keep Overview brief: explain what the integration does, then show practical
  examples one after another under H3 headings. Do not put different tasks in tabs.
- Keep Installation focused on requirements and install commands. A short page
  is fine; do not pad it with import checks or redundant setup explanations.
- Order Getting Started by the actual user workflow: installation, instance
  setup, account/session setup, first organization, then the documented task.
  Use ordinary H2/H3 headings, not numbered Steps wrappers. Short ordered lists
  within setup sections are fine.
- Use documentation components when they help: package-manager tabs and
  semantically colored info/warning callouts. Keep essential prerequisites and
  safety notes close to the action; do not turn every paragraph into a callout.
- Use `index.ts` for simple examples. Include helper imports in the snippet
  where they are used, and include imported packages in installation commands.
- Keep examples short without making them incorrect. Avoid repeated environment
  guards and elaborate scaffolding; retain error handling needed to use results
  safely. Show the actual public result shape.
- Keep secrets such as API keys in environment variables. Put clearly labeled
  example values in code. State setup assumptions instead of silently choosing
  an arbitrary organization or account with different permissions.
- Show JSON responses inline in readable, scrollable code blocks. Do not hide
  them in accordions or add Show more controls. Omit response-block titles.
  Verify examples against current public exports and API schemas. Show complete
  data shapes with illustrative values; never invent response fields.
- Keep identifiers, variable names, and permissions consistent across prose and
  snippets. Distinguish installation IDs, user IDs, organization IDs, and tokens.
- Write finished documentation, not preview filler. Do not describe unsupported
  functionality as available; omit it or state the actual limitation concisely.

### Guides and reference pages

- Guides teach one task: state the outcome and prerequisites, then show the
  working code and full response in task order. Explain decisions that affect
  the outcome and link to reference for exhaustive parameter details. Use plain
  headings, not Steps wrappers, and do not hide separate tasks in tabs.
- Reference pages document one constructor or method. Follow this order:
  method name and purpose, Usage, Returns, Parameters, then relevant behavior
  and errors. Use prose sections, not generated type tables as a substitute for
  explanations.
- Usage examples may show `index.ts` and `client.ts` as two file tabs for the
  same example. File tabs are not tabs for unrelated tasks. Include all helper
  imports and identify additional dependencies.
- Give each parameter an H3 heading using its exact API name, a type, required
  or conditional status, and its default when one exists. Explain what it does,
  where its value comes from, constraints, and omission behavior. Avoid one-word
  descriptions. Do not imply that a code fragment is a complete script or
  silently depend on variables from another example.
- Use H4 sections for nested parameter fields. Document discriminated payloads
  and conditional return fields explicitly.
- Reuse genuinely repeated Markdown through the documentation system's include
  mechanism. Keep task-specific examples in the page. Never replace readable
  content with an opaque runtime-only component.
- Typecheck usage and parameter examples against current source. Validate JSON
  examples against protocol response schemas. Check Markdown exports and
  internal links, not just the visual page. Do not change production data to
  verify documentation examples.

## Architecture knowledge

Start at [`architecture/README.md`](architecture/README.md) and the
[system model](architecture/system.md), then read the owning boundary page.
Architecture documents describe verified current behavior, authority, contracts,
state transitions, transactions, recovery and practical limits, with source links.

- After every major feature or architectural change, update the owning architecture
  pages in the same feature batch. Add a page only when the topic needs a distinct
  owner; keep the index synchronized and link related flows instead of repeating them.
- Update `AGENTS.md` after major work only when package ownership, contributor rules
  or the working sequence actually changes. Do not rewrite it for each feature.
- Small fixes, styling adjustments and local refactors do not require new architecture
  pages or guide edits. Correct existing prose whenever a change makes it inaccurate.
- Package READMEs own supported usage, configuration and package-local commands;
  update affected public behavior there. Architecture owns cross-package reasoning.
  Repository rules stay here; temporary investigation stays in ignored `research/`.
- Write concise technical explanations of what is wired and tested. Include relevant
  failure/recovery behavior and remaining limitations. Keep change logs, completed
  checklists and speculative roadmaps out of architecture pages.
- A schema, placeholder or marketing demonstration alone is not an implemented feature.

## Feature flow

Add a backend feature in dependency order, using the packages that exist and
introducing new package boundaries only when they have a concrete responsibility:

1. Define shared primitives, models, DTOs, and expected errors in `protocol`.
2. Add tables, constraints, relations, migrations, and focused repositories in
   `database` when persistence changes.
3. Implement the application use case, including its transaction boundary,
   required audit event, and only useful logs or low-cardinality metrics.
4. Declare the transport contract, then implement its server handler: enforce
   the actor, apply transport policy such as rate limiting or cookies, call the
   application workflow, and map the result.
5. Add frontend state, hooks, loader prefetching, and UI against that contract.
6. After a major feature, update the owning architecture pages with implemented
   boundaries, verification and concrete limits. Update this guide only if its
   contributor rules or ownership changed; keep affected usage docs accurate.

Build complete features incrementally. Sketch the overall data model first,
then implement the tables required by the next workflow instead of finishing
all tables for a domain upfront.

State changes and their required audit rows must share one transaction. Metrics
describe aggregate behavior and must use bounded attributes; audit events
preserve typed historical context. Logs should record concise decisions or
transitions and must not duplicate secrets or arbitrary payloads. The operator
setup link is an explicitly supported bootstrap output; keep it out of routine
request logging.

## Dependency direction

- `protocol` must not depend on infrastructure, application, or transport code.
- `database` may depend on `protocol`; it owns storage and queries, not business
  authorization, HTTP responses, cookie policy, or email delivery.
- Application workflows coordinate repositories, crypto, audit, and external
  work. They must not import API/server implementations or browser code.
- Transport contracts depend on `protocol`; handlers and runtime composition
  belong at the server edge.
- Frontends use public contracts and HTTP APIs. They must not import database
  credentials, repositories, or server-side persistence models.
- Supply Node/runtime implementations and deployment configuration from the
  runtime composition root. Gate listeners and workers on completed migrations.

## Effect v4

Before writing Effect code, read `node_modules/effect/AGENTS.md` completely and
follow its linked local documentation when relevant. Search
`node_modules/effect/src` for APIs not covered there.

- Define services with class-based `Context.Service` and construct
  implementations with `Layer`.
- Use `Effect.gen` for workflows and `Effect.fn("Service.operation")` for
  functions returning effects.
- Model expected failures with `Schema.TaggedError`; do not hide unexpected
  defects.
- Use Effect `Schema` to decode untrusted input and derive TypeScript types from
  schemas.
- Use Effect `Config` and `Redacted` for runtime configuration and secrets.
- Use platform services such as `Crypto.Crypto`; provide Node implementations
  such as `NodeCrypto.layer` from the server composition root.
- Keep layers focused. Use `Layer.provide` when dependencies should not leak to
  consumers.

## Project practices

- Keep implementations simple. Validate data at external and persistence
  boundaries; do not add redundant validation for code-owned constants or
  trusted configuration.
- Brand values only when identity or confusion between values would cause a real
  defect. Do not brand every string.
- Organize protocol by purpose, then domain: `identifiers/`, `values/`, `model/`,
  `dto/`, `input/` and `errors/`. Public DTOs import shared values/identities,
  never storage models. Use `/dto`, `/input` and `/model` package exports for new
  consumers; root DTO/input exports remain compatible. Keep sensitive persistence
  fields out of public DTOs. Error/status metadata belongs beside the protocol
  error; API owns status-specific HTTP encoding and middleware declarations.
- Put business workflows in `application`, transport definitions in `api`, HTTP
  handlers and authorization in `apps/server`, and queries in `database`.
- Repository methods must work with both the normal database and
  `TransactionService.run`; use the existing transaction context rather than
  passing raw transaction clients through public APIs.
- Store credential digests/HMACs, not raw session or verification credentials.
- When email delivery is introduced, enqueue durable email intent inside the
  business transaction. Do not call a delivery provider inside a SQL transaction.
- Use readonly arrays and objects unless mutation is required.
- Use `#/*` for internal package imports. Use package exports for cross-package
  imports. Include `.js` on relative ESM imports.
- Export only supported public APIs from each package entry point.
- Preserve the `preface-source` development condition and unbundled package build
  unless a package has a documented reason to differ.
- Keep dependencies owned by the package that uses them.
- Use the default pnpm catalog for dependencies shared by multiple workspace
  packages. Keep package-specific dependencies and root-only tooling versions in
  their owning `package.json`. Promote a dependency to the catalog when another
  package starts using it; do not put every new dependency in the catalog. Keep
  `catalogMode: manual` so dependency additions are not automatically promoted.
- Preserve unrelated worktree changes.
- Keep each feature file focused. Extend the existing aggregate service or
  barrel instead of creating a second competing entry point.
- Group files by domain once a flat directory stops being quickly scannable.
  Keep barrels at domain boundaries and preserve existing structure unless a
  reorganization is explicitly requested.
- Separate imports, setup, validation, external calls, transactions, and result
  mapping with logical blank lines. Do not compress unrelated statements into
  one visual block.
- Comments explain non-obvious invariants, security decisions, transaction
  boundaries, provider constraints, or deferred work. Do not narrate syntax or
  add comments that merely restate the following line.

### Frontend UI

- Put presentation reused across apps in `@usepreface/ui` when that package is
  present. Keep router links, query hooks, permissions, mutation state, and toast
  wording in the app. Share styling without merging workflows that have
  different authorization or lifecycle rules.
- Treat the existing frontend file and folder structure as intentional. Follow
  the nearest established pattern and do not move, rename, flatten, or
  reorganize existing code unless the user explicitly requests it.
- Use the shared UI package's semantic color and typography tokens; do not
  hardcode palette colors in application UI.
- Prefer shared components for interactive controls, forms, feedback, surfaces,
  and typography. Use semantic HTML for page structure and router primitives
  for application navigation.
- Preserve accessible names, visible focus, keyboard behavior, field
  descriptions and errors, and live announcements for asynchronous feedback.
- Follow the frontend package's established form and state libraries. Reuse
  Effect schemas through standard-schema adapters when supported; do not
  duplicate the schema with manual parsing or validation.
- Keep route-only components beside their route or route group. Reserve shared
  app component folders for UI used by unrelated routes.
- Keep frontend code modular and easy to maintain. A single-file component can
  remain flat; when it genuinely needs multiple subcomponents, hooks, or
  helpers, split it along those responsibilities. Do not restructure components
  preemptively for possible future complexity.
- Keep route files declarative and small. Split large screens along meaningful
  UI or workflow boundaries instead of accumulating a single large component.
- Keep animation purposeful and support reduced motion. Reuse existing browser
  interaction hooks before reimplementing generic behavior.
- Resolve mutation errors through shared frontend feedback mappings, then
  render concise toasts with a short title and an optional one-line description.
  Do not repeat generic error strings across components.

### Testing

Keep the suite small at this stage. Prefer a few readable tests that protect
important behavior over a large matrix of obvious assertions.

- Test application-owned behavior: transaction propagation and rollback,
  bootstrap token replacement/replay/expiry, concurrent state changes, last-owner
  protection, migration failure/locking, and meaningful protocol transformations
  or security boundaries.
- Do not add tests that merely prove PostgreSQL enforces an ordinary unique,
  not-null, or foreign-key declaration, that Effect validates a basic string
  check, or that TypeScript accepts a type. Keep the constraints themselves.
- Add regression tests when fixing meaningful defects. Expand API and browser
  coverage with the workflows that need it; do not prebuild an exhaustive suite
  for features that do not exist yet.
- Group tests by boundary and domain: `tests/unit/`, `tests/integration/<domain>/`,
  `tests/model/<domain>/`, and `tests/smoke/` as applicable. Shared setup and typed
  fixtures belong in focused `tests/fixtures/` modules.
- Keep actions and assertions explicit in the test body. Do not define local
  helper functions above a suite and hide the scenario behind them. Inline
  one-off setup; move genuinely reused setup into a named fixture module.
- Prefer readability and understanding over fewer lines. Use descriptive names
  and logical blank lines. Avoid opaque tuple matrices, generic assertion
  wrappers, custom test DSLs, or loops that obscure which behavior failed.
- Use Effect Vitest for Effect workflows and ordinary Vitest for pure or public
  Promise APIs. Keep fixtures typed, clocks deterministic, and cleanup scoped to
  resource acquisition. Assert the intended error and durable side effects; a
  generic failure can hide an invalid fixture or missing authentication.
- Compose real repositories and workflows. Replace external services at their
  owning boundaries instead of mocking application internals or building
  parallel test-only repositories when real tables already fit the scenario.
- Use PGlite for fast persistence checks and disposable PostgreSQL for advisory
  locks and concurrency. Run PostgreSQL files sequentially and use the explicit
  test configuration; never fall back to a developer or deployment database.
- Keep compile-only API assertions in the test typecheck lane. Do not remove
  distinct authorization, concurrency, or recovery regressions solely to reach
  a smaller test count.

## Common commands

```sh
pnpm check
pnpm build
pnpm typecheck
pnpm lint
pnpm format
pnpm test
```

Run package-specific commands with `pnpm --filter <package> <script>`. Before
committing, run the narrowest relevant checks followed by `pnpm check` for
cross-package changes. When others are changing unrelated apps, scope formatting
and fixes to the files you own; report unrelated failures instead of editing
someone else's work.

Use conventional commits with small, direct messages. Commit after each
meaningful change unless the user explicitly asks to leave it uncommitted.
