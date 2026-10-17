# Architecture

Technical knowledge base for Preface's implemented system. Start with the
[system model](system.md), then follow the boundary relevant to your work.
Executable schemas, migrations, source and tests settle disagreements with prose.

## Contracts and identity

- [Contracts](integrations/contracts.md): protocol modules, DTOs, application inputs,
  persistence codecs, errors and the shared HTTP contract.
- [Shared cryptography](integrations/crypto.md): credential primitives, keyed
  fingerprints, encryption and compatibility boundaries.
- [Outbound email](integrations/email.md): typed intent, encrypted outbox, provider
  adapters, retries and the renderer/server integration boundary.
- [Instance setup](identity-access/instance-setup.md): installation preparation,
  operator proofs, first-owner creation and recovery from lost setup output.
- [Sessions](identity-access/sessions.md): credential resolution, expiry, activity,
  cookie delivery and audited revocation.

## Data, runtime and interfaces

- [Storage](data/storage.md): domain schemas, repository ownership, transactions,
  migration locking and durable audit.
- [Server](runtime/server.md): runtime composition, startup gates, request policy,
  operational routes, deployment configuration and shutdown.
- [Landing](interfaces/landing.md): page composition, reusable presentation,
  browser interactions, prerendering and deployment boundaries.
- [Development and verification](engineering/development.md): workspace builds,
  source resolution, test lanes and extending the implemented foundation.

## Writing and maintenance

After a major feature or an architectural change, update the owning pages in the
same feature batch. Update the index when a new topic deserves a page, and update
`AGENTS.md` only when contributor guidance or ownership actually changes. Small
fixes do not require new architecture pages or guide edits; correct existing prose
when a change makes it inaccurate.

Write about the current implementation: responsibility, callers, authority,
contracts, state transitions, transaction boundaries and failure/recovery behavior.
Include verification and practical limitations. Add a small source map so readers
can trace decisions into executable code. Scale detail to the topic and omit
sections that do not apply.

Each topic has one owner page. Link related behavior instead of restating it.
Keep package commands and configuration details in package READMEs, repository
instructions in `AGENTS.md`, and temporary investigations in ignored `research/`.
These pages are technical explanations, not change logs, task reports or a roadmap.
Tables and schemas alone do not establish that a workflow, API or UI is wired.
