import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";

import { PasswordService, TokenService } from "../../../src/index.js";
import { SecurityTestLayer } from "../../fixtures/application.js";

layer(SecurityTestLayer)("credential boundaries", (it) => {
  it.effect("uses independently salted Argon2id hashes and preserves the exact password", () =>
    Effect.gen(function* () {
      const passwords = yield* PasswordService;
      const password = Redacted.make("  a long test password  ");
      const first = yield* passwords.hash(password);
      const second = yield* passwords.hash(password);

      expect(first).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
      expect(second).not.toBe(first);
      expect(yield* passwords.verify(password, first)).toBe(true);
      expect(yield* passwords.verify(Redacted.make("a long test password"), first)).toBe(false);
      expect(yield* passwords.verify(Redacted.make("a different password"), first)).toBe(false);
    }),
  );

  it.effect("separates setup and session credentials while redacting raw secrets", () =>
    Effect.gen(function* () {
      const tokens = yield* TokenService;
      const setup = yield* tokens.generateBootstrap();
      const otherSetup = yield* tokens.generateBootstrap();
      const session = yield* tokens.generateSession();

      expect(Redacted.value(setup.token)).not.toBe(Redacted.value(otherSetup.token));
      expect(yield* tokens.verifyBootstrap(setup.token, setup.hash)).toBe(true);
      expect(yield* tokens.verifyBootstrap(otherSetup.token, setup.hash)).toBe(false);
      expect(yield* tokens.verifyBootstrap(setup.token, "malformed-storage-digest")).toBe(false);
      expect(yield* tokens.digestSession(setup.token)).not.toBe(setup.hash);
      expect(yield* tokens.verifyBootstrap(session.token, session.hash)).toBe(false);
      expect(JSON.stringify({ token: setup.token })).not.toContain(Redacted.value(setup.token));
    }),
  );
});
