import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

import { IdentityConnectionId, OrganizationDomainId, OrganizationId } from "@usepreface/protocol";
import {
  ConnectionDomains,
  ConnectionDomainsRequest,
  CreateDomainRequest,
  DomainChallenge,
  DomainRevisionRequest,
  OrganizationDomainList,
  PublicOrganizationDomain,
} from "@usepreface/protocol/dto";

import { identityErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

const params = { organizationId: OrganizationId, domainId: OrganizationDomainId };
const connection = { organizationId: OrganizationId, connectionId: IdentityConnectionId };
const errors = [...identityErrors, ...organizationErrors, ...requestErrors];

export class OrganizationDomainsApi extends HttpApiGroup.make("organizationDomains")
  .add(
    HttpApiEndpoint.get(
      "inspectForOperator",
      "/instance/organizations/:organizationId/domains/:domainId",
      { params, success: PublicOrganizationDomain, error: errors },
    ),
    HttpApiEndpoint.post(
      "withdrawApproval",
      "/instance/organizations/:organizationId/domains/:domainId/revoke",
      { params, payload: DomainRevisionRequest, success: PublicOrganizationDomain, error: errors },
    ),
    HttpApiEndpoint.get("list", "/organizations/:organizationId/domains", {
      params: { organizationId: OrganizationId },
      success: OrganizationDomainList,
      error: errors,
    }),
    HttpApiEndpoint.post("create", "/organizations/:organizationId/domains", {
      params: { organizationId: OrganizationId },
      payload: CreateDomainRequest,
      success: PublicOrganizationDomain,
      error: errors,
    }),
    HttpApiEndpoint.post(
      "request",
      "/organizations/:organizationId/domains/:domainId/verification/request",
      { params, payload: DomainRevisionRequest, success: DomainChallenge, error: errors },
    ),
    HttpApiEndpoint.post(
      "verify",
      "/organizations/:organizationId/domains/:domainId/verification/confirm",
      { params, payload: DomainRevisionRequest, success: PublicOrganizationDomain, error: errors },
    ),
    HttpApiEndpoint.delete("revoke", "/organizations/:organizationId/domains/:domainId", {
      params,
      payload: DomainRevisionRequest,
      success: PublicOrganizationDomain,
      error: errors,
    }),
    HttpApiEndpoint.post(
      "approve",
      "/instance/organizations/:organizationId/domains/:domainId/approve",
      { params, payload: DomainRevisionRequest, success: PublicOrganizationDomain, error: errors },
    ),
    HttpApiEndpoint.get(
      "connectionDomains",
      "/organizations/:organizationId/identity-connections/:connectionId/domains",
      { params: connection, success: ConnectionDomains, error: errors },
    ),
    HttpApiEndpoint.put(
      "bind",
      "/organizations/:organizationId/identity-connections/:connectionId/domains",
      {
        params: connection,
        payload: ConnectionDomainsRequest,
        success: ConnectionDomains,
        error: errors,
      },
    ),
  )
  .middleware(SessionAuthentication)
  .annotate(OpenApi.Title, "Enterprise domain verification") {}
