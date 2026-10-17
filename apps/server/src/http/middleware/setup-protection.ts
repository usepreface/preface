import { Effect, Layer, Option } from "effect";
import { HttpServerRequest, HttpServerResponse } from "effect/http";

import { SetupProtection } from "@usepreface/api";

import { ServerConfig } from "#/config";
import { requestErrorResponse } from "#/http/errors";
import { clientAddress } from "#/http/middleware/client-address";
import { RequestLimits } from "#/http/middleware/limits";

export const SetupProtectionLive = Layer.effect(
  SetupProtection,
  Effect.gen(function* () {
    const config = yield* ServerConfig;
    const limits = yield* RequestLimits;

    return SetupProtection.of(
      Effect.fn("http.protectSetup")(function* (httpEffect, { endpoint }) {
        if (
          endpoint.identifier !== "inspect" &&
          endpoint.identifier !== "complete" &&
          endpoint.identifier !== "requestVerification" &&
          endpoint.identifier !== "resendVerification"
        )
          return yield* httpEffect;
        const request = yield* HttpServerRequest.HttpServerRequest;
        const wait = yield* limits.check(
          endpoint.identifier === "inspect"
            ? "inspect"
            : endpoint.identifier === "complete"
              ? "complete"
              : "issue",
          clientAddress(request, config.trustedProxyNetworks),
        );
        if (wait !== undefined)
          return HttpServerResponse.setHeader(
            requestErrorResponse("RATE_LIMITED"),
            "retry-after",
            String(wait),
          );
        if (endpoint.identifier === "inspect") return yield* httpEffect;

        // Key admission to matched endpoint metadata, so alternate URL spellings cannot bypass it.
        const result = yield* limits.runSetup(httpEffect);
        return Option.getOrElse(result, () =>
          HttpServerResponse.setHeader(requestErrorResponse("RATE_LIMITED"), "retry-after", "1"),
        );
      }),
    );
  }),
);
