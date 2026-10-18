import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

import { OrganizationId } from "@usepreface/protocol";
import {
  AuditEventPage,
  AuditExport,
  AuditExportQuery,
  ListAuditEventsQuery,
} from "@usepreface/protocol/dto";

import { identityErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

const errors = [...identityErrors, ...organizationErrors, ...requestErrors];
export class AuditApi extends HttpApiGroup.make("audit")
  .add(
    HttpApiEndpoint.get("organization", "/organizations/:organizationId/audit-events", {
      params: { organizationId: OrganizationId },
      query: ListAuditEventsQuery,
      success: AuditEventPage,
      error: errors,
    }),
    HttpApiEndpoint.get(
      "exportOrganization",
      "/organizations/:organizationId/audit-events/export",
      {
        params: { organizationId: OrganizationId },
        query: AuditExportQuery,
        success: AuditExport,
        error: errors,
      },
    ),
    HttpApiEndpoint.get("instance", "/instance/audit-events", {
      query: ListAuditEventsQuery,
      success: AuditEventPage,
      error: errors,
    }),
    HttpApiEndpoint.get("exportInstance", "/instance/audit-events/export", {
      query: AuditExportQuery,
      success: AuditExport,
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .annotate(OpenApi.Title, "Audit history") {}
