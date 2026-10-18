import { NodeHttpServer } from "@effect/platform-node";
import { Context, Effect, Layer } from "effect";
import { HttpRouter } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import type { Database } from "@usepreface/database";

import type { ServerConfig } from "#/config";
import { DocumentationRoutes } from "#/http/documentation";
import { RequestLimits } from "#/http/middleware/limits";
import { makeRequestPolicy } from "#/http/middleware/request-policy";
import { SessionAuthenticationLive } from "#/http/middleware/session-authentication";
import { SetupProtectionLive } from "#/http/middleware/setup-protection";
import { AuditRoutes } from "#/http/routes/audit/history";
import { AccountsRoutes } from "#/http/routes/auth/accounts";
import {
  AuthenticationDiscoveryRoutes,
  OrganizationSelectionRoutes,
} from "#/http/routes/auth/discovery";
import { EmailSignInRoutes } from "#/http/routes/auth/email-sign-in";
import { ExternalAuthenticationRoutes } from "#/http/routes/auth/external";
import { GoogleRoutes } from "#/http/routes/auth/google";
import { InvitationsRoutes } from "#/http/routes/auth/invitations";
import { OidcRoutes } from "#/http/routes/auth/oidc";
import { ReauthenticationRoutes } from "#/http/routes/auth/reauthentication";
import { SamlRoutes } from "#/http/routes/auth/saml";
import { SessionRoutes } from "#/http/routes/auth/session";
import { SessionsRoutes } from "#/http/routes/auth/sessions";
import { HealthRoutes } from "#/http/routes/health";
import { IdentityConnectionsRoutes } from "#/http/routes/instance/identity-connections";
import { InstanceSetupRoutes } from "#/http/routes/instance/setup";
import { OrganizationAuthRecoveryRoutes } from "#/http/routes/organization/auth-recovery";
import { AuthenticationPolicyRoutes } from "#/http/routes/organization/authentication-policy";
import { OrganizationDomainsRoutes } from "#/http/routes/organization/domains";
import { OrganizationIdentityConnectionsRoutes } from "#/http/routes/organization/identity-connections";
import { OrganizationInvitationsRoutes } from "#/http/routes/organization/invitations";
import { OrganizationMembersRoutes } from "#/http/routes/organization/members";
import {
  OrganizationsRoutes,
  InstanceCapabilitiesRoutes,
} from "#/http/routes/organization/organizations";
import { OrganizationOwnershipRoutes } from "#/http/routes/organization/ownership";
import { OrganizationRoleBindingsRoutes } from "#/http/routes/organization/role-bindings";
import { OrganizationRolesRoutes } from "#/http/routes/organization/roles";
import { TeamsRoutes } from "#/http/routes/organization/teams";
import { ProfileRoutes } from "#/http/routes/user/profile";

const ProductRoutes = HttpApiBuilder.layer(PrefaceApi, { openapiPath: "/api/openapi.json" }).pipe(
  Layer.provide(
    Layer.mergeAll(
      AuditRoutes,
      AuthenticationDiscoveryRoutes,
      OrganizationSelectionRoutes,
      ExternalAuthenticationRoutes,
      OrganizationDomainsRoutes,
      OidcRoutes,
      SamlRoutes,
      OrganizationIdentityConnectionsRoutes,
      GoogleRoutes,
      IdentityConnectionsRoutes,
      AccountsRoutes,
      ReauthenticationRoutes,
      AuthenticationPolicyRoutes,
      OrganizationAuthRecoveryRoutes,
      TeamsRoutes,
      ProfileRoutes,
      InstanceSetupRoutes,
      SessionRoutes,
      EmailSignInRoutes,
      InvitationsRoutes,
      OrganizationInvitationsRoutes,
      SessionsRoutes,
      OrganizationsRoutes,
      InstanceCapabilitiesRoutes,
      OrganizationMembersRoutes,
      OrganizationRolesRoutes,
      OrganizationRoleBindingsRoutes,
      OrganizationOwnershipRoutes,
    ).pipe(Layer.provideMerge(Layer.mergeAll(SessionAuthenticationLive, SetupProtectionLive))),
  ),
);

const makeHttpApplication = Effect.gen(function* () {
  const context = yield* Effect.context<Database | ServerConfig>();
  const policy = yield* makeRequestPolicy;
  const routes = yield* HttpRouter.toHttpEffect(
    Layer.mergeAll(ProductRoutes, DocumentationRoutes, HealthRoutes),
  ).pipe(
    Effect.provideService(HttpRouter.RouterConfig, {
      ignoreDuplicateSlashes: false,
      ignoreTrailingSlash: false,
    }),
  );
  return { handle: policy(routes).pipe(Effect.provideContext(context)) } as const;
});

export class HttpApplication extends Context.Service<
  HttpApplication,
  Effect.Success<typeof makeHttpApplication>
>()("@usepreface/server/http/HttpApplication") {
  static readonly layer = Layer.effect(HttpApplication, makeHttpApplication).pipe(
    Layer.provide(RequestLimits.layer),
    Layer.provide(NodeHttpServer.layerHttpServices),
  );
}
