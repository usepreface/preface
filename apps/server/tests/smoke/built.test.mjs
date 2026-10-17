import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "node:test";
import { promisify } from "node:util";

import { Effect } from "effect";

import { Database } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import {
  availablePort,
  serverDirectory,
  setupLink,
  spawnBackend,
  testEnvironment,
  waitForReadiness,
  waitForDevelopmentCode,
} from "../fixtures/process.mjs";

const execute = promisify(execFile);
const databasePort = process.env.PREFACE_TEST_POSTGRES_PORT;

test("built CLI help requires no deployment configuration", async () => {
  const { stdout } = await execute(process.execPath, ["dist/main.js", "--help"], {
    cwd: serverDirectory,
    env: { PATH: process.env.PATH, NO_COLOR: "1" },
    timeout: 5000,
  });
  assert.match(stdout, /Preface backend/);
  assert.match(stdout, /serve/);
  assert.match(stdout, /instance/);
});

test(
  "built startup, operator replacement, restart and completion share durable state",
  { skip: databasePort === undefined, timeout: 30_000 },
  async (context) => {
    const database = TestDatabase.postgresLayer(Number(databasePort));
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
      }).pipe(Effect.provide(database)),
    );
    const port = await availablePort();
    const env = testEnvironment(databasePort, port);
    const base = `http://127.0.0.1:${port}`;
    const origin = env.PUBLIC_URL;
    const running = spawnBackend(env);
    context.after(() => running.close());
    await waitForReadiness(port, running);
    const initial = setupLink(running.stdout);
    const initialToken = new URLSearchParams(initial.hash.slice(1)).get("token");
    assert.equal(initial.origin, origin);
    assert.equal((await fetch(`${base}/api/docs`)).status, 200);
    assert.equal((await fetch(`${base}/api/openapi.json`)).status, 200);

    const { stdout } = await execute(
      process.execPath,
      ["dist/main.js", "instance", "setup-link", "reissue", "--log-level", "none"],
      {
        cwd: serverDirectory,
        env,
        timeout: 10_000,
      },
    );
    const replacement = setupLink(stdout);
    const replacementToken = new URLSearchParams(replacement.hash.slice(1)).get("token");
    assert.notEqual(replacementToken, initialToken);
    const oldProof = await fetch(`${base}/api/v1/instance/setup/inspect`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ token: initialToken }),
    });
    assert.equal(oldProof.status, 401);

    await running.close();
    const restarted = spawnBackend(env);
    context.after(() => restarted.close());
    await waitForReadiness(port, restarted);
    assert.match(restarted.stdout, /setup-link reissue/);
    assert.doesNotMatch(restarted.stdout, /\/setup#token=/);

    const requested = await fetch(`${base}/api/v1/instance/setup`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({
        token: replacementToken,
        instanceName: "Preface",
        ownerName: "Owner",
        email: "owner@example.test",
      }),
    });
    assert.equal(requested.status, 202);
    assert.equal(requested.headers.get("set-cookie"), null);
    const verification = await requested.json();
    // Exercise the actual scoped worker and development renderer after a durable enqueue.
    const code = await waitForDevelopmentCode(restarted);
    const completed = await fetch(`${base}/api/v1/instance/setup/verify`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({
        token: replacementToken,
        challengeId: verification.challengeId,
        code,
      }),
    });
    assert.equal(completed.status, 201);
    const firstActor = await completed.json();
    assert.equal(typeof firstActor.user.emailVerifiedAt, "string");
    assert.ok(completed.headers.get("set-cookie")?.includes("HttpOnly"));
    const firstCookie = completed.headers.get("set-cookie").split(";", 1)[0];
    assert.equal(
      (
        await fetch(`${base}/api/v1/auth/session`, {
          method: "DELETE",
          headers: { origin, cookie: firstCookie },
        })
      ).status,
      204,
    );
    const outputOffset = restarted.stdout.length;
    const signIn = await fetch(`${base}/api/v1/auth/email/request`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ email: "owner@example.test" }),
    });
    assert.equal(signIn.status, 202);
    const signInChallenge = await signIn.json();
    const browserCookie = signIn.headers.get("set-cookie").split(";", 1)[0];
    const signInCode = await waitForDevelopmentCode(restarted, outputOffset);
    const signedIn = await fetch(`${base}/api/v1/auth/email/verify`, {
      method: "POST",
      headers: { origin, "content-type": "application/json", cookie: browserCookie },
      body: JSON.stringify({
        challengeId: signInChallenge.challengeId,
        method: "code",
        code: signInCode,
      }),
    });
    assert.equal(signedIn.status, 201);
    const returningActor = await signedIn.json();
    assert.deepEqual(returningActor.user, firstActor.user);
    assert.notEqual(returningActor.session.id, firstActor.session.id);
    const sessionCookie = signedIn.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith("preface_session="))
      ?.split(";", 1)[0];
    assert.ok(sessionCookie);
    const listed = await fetch(`${base}/api/v1/auth/sessions`, {
      headers: { cookie: sessionCookie },
    });
    assert.equal(listed.status, 200);
    assert.equal((await listed.json()).sessions.length, 1);
    assert.equal(
      (
        await fetch(`${base}/api/v1/auth/sessions`, {
          method: "DELETE",
          headers: { origin, cookie: sessionCookie },
        })
      ).status,
      204,
    );
    assert.equal(
      (await fetch(`${base}/api/v1/auth/session`, { headers: { cookie: sessionCookie } })).status,
      401,
    );

    await assert.rejects(
      execute(process.execPath, ["dist/main.js", "instance", "setup-link", "reissue"], {
        cwd: serverDirectory,
        env,
        timeout: 10_000,
      }),
      (error) => /already complete/.test(error.stderr + error.stdout),
    );
  },
);

test(
  "a failed startup preparation never opens the listener",
  { skip: databasePort === undefined, timeout: 15_000 },
  async (context) => {
    const port = await availablePort();
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          yield* (yield* TestDatabase).reset;
          const sql = (yield* Database).$client;
          yield* Effect.acquireRelease(
            sql`create function instance.reject_test_startup() returns trigger language plpgsql as $$ begin raise exception 'Startup storage unavailable'; end $$`,
            () => sql`drop function instance.reject_test_startup() cascade`.pipe(Effect.orDie),
          );
          yield* sql`create trigger reject_test_startup before insert on instance.installation for each row execute function instance.reject_test_startup()`;
          const running = spawnBackend(testEnvironment(databasePort, port));
          context.after(() => running.close());
          const [status] = yield* Effect.promise(() => running.exited);
          assert.notEqual(status, 0);
          assert.doesNotMatch(running.stdout, /\/setup#token=/);
          assert.doesNotMatch(running.stderr, /insert into|Startup storage unavailable/);
          yield* Effect.promise(() =>
            assert.rejects(fetch(`http://127.0.0.1:${port}/health/live`)),
          );
        }),
      ).pipe(Effect.provide(TestDatabase.postgresLayer(Number(databasePort)))),
    );
    const recovered = spawnBackend(testEnvironment(databasePort, port));
    context.after(() => recovered.close());
    await waitForReadiness(port, recovered);
    assert.ok(setupLink(recovered.stdout));
  },
);
