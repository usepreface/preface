import { Context } from "effect";

// The runtime supplies a validated public origin; application code never imports server configuration.
export class AuthenticationLinks extends Context.Service<
  AuthenticationLinks,
  {
    readonly publicOrigin: string;
  }
>()("@usepreface/application/auth/AuthenticationLinks") {}
