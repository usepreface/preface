import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import {
  CreateOidcConnectionInput,
  UpdateOidcConnectionInput,
  CreateSamlConnectionInput,
  UpdateSamlConnectionInput,
} from "@usepreface/protocol/input";

import { oidcFlowCookie, samlFlowCookie } from "#/http/cookies/browser-proof";
import { mapInfrastructureError } from "#/http/errors";
import { currentOrganizationId } from "#/http/organization";

export const OrganizationIdentityConnectionsRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "organizationIdentityConnections",
  (handlers) =>
    Effect.gen(function* () {
      const application = yield* Application;
      const connections = application.organization.identityConnection;
      return handlers.handleAll({
        list: Effect.fn("http.oidcConnections.list")(function* () {
          return yield* connections
            .list(yield* CurrentActor, yield* currentOrganizationId)
            .pipe(mapInfrastructureError);
        }),
        get: Effect.fn("http.oidcConnections.get")(function* ({ params }) {
          return yield* connections
            .get(yield* CurrentActor, yield* currentOrganizationId, params.connectionId)
            .pipe(mapInfrastructureError);
        }),
        create: Effect.fn("http.oidcConnections.create")(function* ({ payload }) {
          const input = yield* Schema.decodeUnknownEffect(CreateOidcConnectionInput)(payload).pipe(
            Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
          );
          return yield* connections
            .createOidc(yield* CurrentActor, yield* currentOrganizationId, input)
            .pipe(mapInfrastructureError);
        }),
        createSaml: Effect.fn("http.identityConnections.createSaml")(function* ({ payload }) {
          const input = yield* Schema.decodeUnknownEffect(CreateSamlConnectionInput)(payload).pipe(
            Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
          );
          return yield* connections
            .createSaml(yield* CurrentActor, yield* currentOrganizationId, input)
            .pipe(mapInfrastructureError);
        }),
        updateSaml: Effect.fn("http.identityConnections.updateSaml")(function* ({
          params,
          payload,
        }) {
          const input = yield* Schema.decodeUnknownEffect(UpdateSamlConnectionInput)(payload).pipe(
            Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
          );
          return yield* connections
            .updateSaml(
              yield* CurrentActor,
              yield* currentOrganizationId,
              params.connectionId,
              input,
            )
            .pipe(mapInfrastructureError);
        }),
        rotateSigningKey: Effect.fn("http.identityConnections.rotateSigningKey")(function* ({
          params,
          payload,
        }) {
          return yield* connections
            .rotateSigningKey(
              yield* CurrentActor,
              yield* currentOrganizationId,
              params.connectionId,
              payload.expectedRevision,
            )
            .pipe(mapInfrastructureError);
        }),
        update: Effect.fn("http.oidcConnections.update")(function* ({ params, payload }) {
          const input = yield* Schema.decodeUnknownEffect(UpdateOidcConnectionInput)(payload).pipe(
            Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
          );
          return yield* connections
            .updateOidc(
              yield* CurrentActor,
              yield* currentOrganizationId,
              params.connectionId,
              input,
            )
            .pipe(mapInfrastructureError);
        }),
        test: Effect.fn("http.oidcConnections.test")(function* ({ params, payload }) {
          const result = yield* connections
            .test(
              yield* CurrentActor,
              yield* currentOrganizationId,
              params.connectionId,
              payload.expectedRevision,
            )
            .pipe(mapInfrastructureError);
          yield* (result.provider === "saml" ? samlFlowCookie : oidcFlowCookie).set(
            result.browserToken,
            result.expiresAt,
          );
          return { authorizationUrl: result.authorizationUrl, expiresAt: result.expiresAt };
        }),
        activate: Effect.fn("http.oidcConnections.activate")(function* ({ params, payload }) {
          return yield* connections
            .activate(
              yield* CurrentActor,
              yield* currentOrganizationId,
              params.connectionId,
              payload.expectedRevision,
            )
            .pipe(mapInfrastructureError);
        }),
        disable: Effect.fn("http.oidcConnections.disable")(function* ({ params, payload }) {
          return yield* connections
            .disable(
              yield* CurrentActor,
              yield* currentOrganizationId,
              params.connectionId,
              payload.expectedRevision,
            )
            .pipe(mapInfrastructureError);
        }),
        refreshMetadata: Effect.fn("http.oidcConnections.refreshMetadata")(function* ({
          params,
          payload,
        }) {
          return yield* connections
            .refreshMetadata(
              yield* CurrentActor,
              yield* currentOrganizationId,
              params.connectionId,
              payload.expectedRevision,
            )
            .pipe(mapInfrastructureError);
        }),
        link: Effect.fn("http.oidcConnections.link")(function* ({ params, payload }) {
          const result = yield* connections
            .startLink(
              yield* CurrentActor,
              yield* currentOrganizationId,
              params.connectionId,
              payload,
            )
            .pipe(mapInfrastructureError);
          yield* (result.provider === "saml" ? samlFlowCookie : oidcFlowCookie).set(
            result.browserToken,
            result.expiresAt,
          );
          return { authorizationUrl: result.authorizationUrl, expiresAt: result.expiresAt };
        }),
        reauthenticate: Effect.fn("http.oidcConnections.reauthenticate")(function* ({
          params,
          payload,
        }) {
          const result = yield* connections
            .startReauthentication(
              yield* CurrentActor,
              yield* currentOrganizationId,
              params.connectionId,
              payload,
            )
            .pipe(mapInfrastructureError);
          yield* (result.provider === "saml" ? samlFlowCookie : oidcFlowCookie).set(
            result.browserToken,
            result.expiresAt,
          );
          return { authorizationUrl: result.authorizationUrl, expiresAt: result.expiresAt };
        }),
      });
    }),
);
