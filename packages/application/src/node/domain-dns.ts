import { Resolver } from "node:dns/promises";

import { Effect, Layer, Predicate } from "effect";

import { IdentityError } from "@usepreface/protocol";

import { DomainDns } from "#/organization/domain/dns";

export const NodeDomainDns = {
  layer: Layer.succeed(DomainDns, {
    resolveTxt: Effect.fn("NodeDomainDns.resolveTxt")(function* (name: string) {
      return yield* Effect.tryPromise({
        try: async (signal) => {
          const resolver = new Resolver({ timeout: 3000, tries: 2 });
          const cancel = () => resolver.cancel();
          signal.addEventListener("abort", cancel, { once: true });
          try {
            const records = await resolver.resolveTxt(name);
            return records
              .slice(0, 100)
              .map((chunks) => chunks.join(""))
              .filter((record) => record.length <= 1024);
          } catch (error) {
            if (
              Predicate.hasProperty(error, "code") &&
              (error.code === "ENODATA" || error.code === "ENOTFOUND")
            )
              return [];
            throw error;
          } finally {
            signal.removeEventListener("abort", cancel);
          }
        },
        catch: () => new IdentityError({ code: "DNS_UNAVAILABLE" }),
      }).pipe(
        Effect.timeoutOrElse({
          duration: "8 seconds",
          orElse: () => Effect.fail(new IdentityError({ code: "DNS_UNAVAILABLE" })),
        }),
      );
    }),
  }),
};
