import { Context } from "effect";

// The runtime supplies a validated public origin; application code never imports server configuration.
export class AuthenticationLinks extends Context.Service<
  AuthenticationLinks,
  {
    readonly publicOrigin: string;
    readonly dashboardOrigin?: string | undefined;
  }
>()("@usepreface/application/auth/AuthenticationLinks") {}

export const authenticationDestination = (links: AuthenticationLinks["Service"], path: string) =>
  links.dashboardOrigin === undefined || path === "/api/docs"
    ? path
    : new URL(path, links.dashboardOrigin).href;
