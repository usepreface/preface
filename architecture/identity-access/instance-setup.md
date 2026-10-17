# Instance setup

First startup initializes one installation and its default settings, then issues a
short-lived proof authorizing first-owner creation. The server prints the operator
link after the issuance transaction commits. Setup creates no organization and does
not verify the owner's email address.

## Preparation and proof state

| Durable condition                  | Ordinary startup                   | Explicit reissue                |
| ---------------------------------- | ---------------------------------- | ------------------------------- |
| No installation                    | Initialize it and issue a proof    | Initialize it and issue a proof |
| Incomplete, no current valid proof | Issue a proof                      | Issue a proof                   |
| Incomplete, current valid proof    | Preserve it; return pending expiry | Replace it immediately          |
| Completed                          | Return ready                       | Refuse with `ALREADY_COMPLETED` |

The application generates entropy outside the transaction, initializes storage
idempotently and locks the installation row before examining its current state.
Issuance/replacement and `instance.bootstrap_token_issued` commit together. Audit
metadata says whether an existing digest was replaced and contains no credential.
The proof is valid for 30 minutes; only its digest and issuance/expiry window persist.

Only the issuing caller receives the redacted raw proof. Another replica or a restart
cannot reconstruct it and does not replace a valid pending proof. The server builds
`PUBLIC_URL/setup#token=…` as explicitly supported operator output. The fragment stays
outside the HTTP request target. `/setup` is reserved for a future onboarding UI and
is not served by the current backend.

`preface instance setup-link reissue` is the local replacement command. It uses the
same application/database composition and refuses completed setup. There is no HTTP
replacement endpoint. Protect access to the container and its operator logs.

## Completing setup

The public API exposes safe status, proof inspection and completion. Inspection
checks the proof/window without consuming it. Completion first decodes the wire
request into the normalized redacted input and checks the proof before expensive
password hashing. Hashing and session-secret generation happen outside SQL locks.

The completion transaction then locks installation and rechecks the current proof
and fresh expiry. It writes:

1. The user with an unverified email and its encoded password credential.
2. The bootstrap instance-owner grant and instance display name/revision.
3. The initial session with an opaque credential digest and absolute expiry.
4. Completed installation state, with all setup-proof metadata cleared.
5. Owner-granted, session-created and bootstrap-completed audit events.

Audit failure rolls back the entire change. Concurrent completions admit one winner.
A proof replaced or expired during hashing cannot complete setup. The repository's
final conditional completion also rechecks proof eligibility. Only the canonical
email uniqueness violation maps to `EMAIL_UNAVAILABLE`; unrelated storage failures
remain operational failures.

After commit, the server sets the session cookie and returns the safe actor with 201. The credential is never returned in JSON. See [sessions](sessions.md) for its
delivery, expiry and authority boundaries.

## Recovery and limits

Lost setup output requires explicit replacement or expiry followed by preparation.
A failed transaction leaves the proof usable until its expiry. A lost HTTP response
can follow successful completion: the consumed proof cannot be replayed to obtain
another session. Sign-in and account recovery are not implemented yet, so do not
automatically retry completion as though a timeout proves failure.

Application tests cover restart/reissue/expiry, concurrent completion, proof changes
during hashing and audit rollback. Built PostgreSQL process tests verify durable
replacement/restart and refusal to open the listener after preparation failure.

## Source

- [Application workflow](../../packages/application/src/instance/bootstrap.ts)
- [Installation repository](../../packages/database/src/repositories/instance/installation.ts)
- [Startup gate](../../apps/server/src/startup.ts)
- [Operator output](../../apps/server/src/operator/setup-link.ts)
- [HTTP handlers](../../apps/server/src/http/routes/instance-setup.ts)
- [Application regressions](../../packages/application/tests/integration/instance)
- [Built process tests](../../apps/server/tests/smoke/built.test.mjs)
