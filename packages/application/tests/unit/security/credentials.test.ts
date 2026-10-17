import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";

import { TokenService } from "../../../src/index.js";
import { SecurityTestLayer } from "../../fixtures/application.js";

layer(SecurityTestLayer)("credential boundaries", (it) => {
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
