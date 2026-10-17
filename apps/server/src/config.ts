import { Config, Context, Effect, Layer, Result, Schema } from "effect";
import { IpNetwork } from "effect/net";

const originSchema = Schema.URLFromString.check(
  Schema.makeFilter(
    (url) =>
      ((url.protocol === "https:" ||
        (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) &&
        url.username === "" &&
        url.password === "" &&
        url.pathname === "/" &&
        url.search === "" &&
        url.hash === "") ||
      "Expected an HTTPS origin, or HTTP loopback origin, without credentials, path, query or fragment",
  ),
);

const networkSchema = Schema.String.check(
  Schema.makeFilter(
    (value) =>
      Result.isSuccess(IpNetwork.fromString(value)) || "Expected an IP network in CIDR notation",
  ),
);

const makeServerConfig = Effect.gen(function* () {
  const config = yield* Config.all({
    host: Config.NonEmptyString("SERVER_HOST").pipe(Config.withDefault("0.0.0.0")),
    port: Config.schema(
      Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
      "SERVER_PORT",
    ).pipe(Config.withDefault(8080)),
    publicUrl: Config.schema(originSchema, "PUBLIC_URL"),
    corsOrigins: Config.Array(originSchema, "CORS_ALLOWED_ORIGINS").pipe(Config.withDefault([])),
    trustedProxyCidrs: Config.Array(networkSchema, "TRUSTED_PROXY_CIDRS").pipe(
      Config.withDefault([]),
    ),
  });

  return {
    ...config,
    secureCookies: config.publicUrl.protocol === "https:",
    allowedOrigins: new Set([
      config.publicUrl.origin,
      ...config.corsOrigins.map((url) => url.origin),
    ]),
    trustedProxyNetworks: config.trustedProxyCidrs.map(IpNetwork.fromStringUnsafe),
  } as const;
});

export class ServerConfig extends Context.Service<
  ServerConfig,
  Effect.Success<typeof makeServerConfig>
>()("@usepreface/server/ServerConfig") {
  static readonly layer = Layer.effect(ServerConfig, makeServerConfig);
}
