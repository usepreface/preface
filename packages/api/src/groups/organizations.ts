import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";
import { HttpApiSchema } from "effect/http-api";

import { OrganizationId } from "@usepreface/protocol";
import {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  ListOrganizationsQuery,
  OrganizationList,
  OrganizationDetail,
  PublicOrganization,
  OrganizationAccessInfo,
  PublicOrganizationAuthPolicy,
} from "@usepreface/protocol/dto";

import { organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class OrganizationsApi extends HttpApiGroup.make("organizations")
  .add(
    HttpApiEndpoint.post("create", "/", {
      payload: CreateOrganizationRequest,
      success: OrganizationDetail.pipe(HttpApiSchema.status(201)),
      error: [...organizationErrors, ...requestErrors],
    }).annotate(OpenApi.Summary, "Create an organization as an instance owner"),
    HttpApiEndpoint.get("list", "/", {
      query: ListOrganizationsQuery,
      success: OrganizationList,
      error: [...organizationErrors, ...requestErrors],
    }).annotate(OpenApi.Summary, "List organizations through current memberships"),
    HttpApiEndpoint.get("get", "/:organizationId", {
      params: { organizationId: OrganizationId },
      success: OrganizationDetail,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.get("access", "/:organizationId/access", {
      params: { organizationId: OrganizationId },
      success: OrganizationAccessInfo,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.patch("update", "/:organizationId", {
      params: { organizationId: OrganizationId },
      payload: UpdateOrganizationRequest,
      success: PublicOrganization,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("archive", "/:organizationId/archive", {
      params: { organizationId: OrganizationId },
      payload: Schema.Struct({}),
      success: PublicOrganization,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("restore", "/:organizationId/restore", {
      params: { organizationId: OrganizationId },
      payload: Schema.Struct({}),
      success: PublicOrganization,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.get("authPolicy", "/:organizationId/auth-policy", {
      params: { organizationId: OrganizationId },
      success: PublicOrganizationAuthPolicy,
      error: [...organizationErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organizations")
  .annotate(OpenApi.Title, "Organizations") {}
