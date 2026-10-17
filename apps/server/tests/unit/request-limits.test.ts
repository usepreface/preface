import { expect, layer } from "@effect/vitest";
import { Deferred, Effect, Fiber, Option } from "effect";
import { HttpServerRequest } from "effect/http";
import { IpNetwork } from "effect/net";
import { TestClock } from "effect/testing";

import { clientAddress } from "../../src/http/middleware/client-address.js";
import { RequestLimits } from "../../src/http/middleware/limits.js";

layer(RequestLimits.layer)("request admission", (it) => {
  it.effect(
    "keeps setup attempts bounded, resets elapsed windows and rejects excess concurrent work",
    () =>
      Effect.gen(function* () {
        const limits = yield* RequestLimits;
        yield* limits.check("issue", "192.0.2.1");
        yield* limits.check("issue", "192.0.2.1");
        yield* limits.check("issue", "192.0.2.1");
        yield* limits.check("issue", "192.0.2.1");
        yield* limits.check("issue", "192.0.2.1");
        expect(yield* limits.check("issue", "192.0.2.1")).toBe(60);
        expect(yield* limits.check("issue", "192.0.2.2")).toBeUndefined();
        yield* TestClock.adjust("1 minute");
        expect(yield* limits.check("issue", "192.0.2.1")).toBeUndefined();

        const firstEntered = yield* Deferred.make<void>();
        const secondEntered = yield* Deferred.make<void>();
        const release = yield* Deferred.make<void>();
        const first = yield* Effect.forkChild(
          limits.runSetup(
            Deferred.succeed(firstEntered, undefined).pipe(Effect.andThen(Deferred.await(release))),
          ),
        );
        const second = yield* Effect.forkChild(
          limits.runSetup(
            Deferred.succeed(secondEntered, undefined).pipe(
              Effect.andThen(Deferred.await(release)),
            ),
          ),
        );
        yield* Deferred.await(firstEntered);
        yield* Deferred.await(secondEntered);
        expect(Option.isNone(yield* limits.runSetup(Effect.succeed("excess")))).toBe(true);
        yield* Deferred.succeed(release, undefined);
        yield* Fiber.join(first);
        yield* Fiber.join(second);
        expect(Option.isSome(yield* limits.runSetup(Effect.succeed("available")))).toBe(true);
      }),
  );

  it.effect("trusts forwarded addresses only through the configured chain of proxy networks", () =>
    Effect.sync(() => {
      const request = HttpServerRequest.fromWeb(
        new Request("http://localhost/", {
          headers: { "x-forwarded-for": "198.51.100.1, 192.0.2.10" },
        }),
      ).modify({ remoteAddress: Option.some("::ffff:127.0.0.1") });
      expect(clientAddress(request, [])).toBe("127.0.0.1");
      expect(clientAddress(request, [IpNetwork.fromStringUnsafe("127.0.0.0/8")])).toBe(
        "192.0.2.10",
      );
      expect(
        clientAddress(request, [
          IpNetwork.fromStringUnsafe("127.0.0.0/8"),
          IpNetwork.fromStringUnsafe("192.0.2.0/24"),
        ]),
      ).toBe("198.51.100.1");
    }),
  );
});
