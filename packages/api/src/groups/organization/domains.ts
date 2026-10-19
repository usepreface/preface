import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

import { IdentityConnectionId, OrganizationDomainId } from "@usepreface/protocol";
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

const params = { domainId: OrganizationDomainId };

const connection = { connectionId: IdentityConnectionId };

const errors = [...identityErrors, ...organizationErrors, ...requestErrors];

export class OrganizationDomainsApi extends HttpApiGroup.make("organizationDomains")
  .add(
    HttpApiEndpoint.get("inspectForOperator", "/instance/organization/domains/:domainId", {
      params,
      success: PublicOrganizationDomain,
      error: errors,
    }),
    HttpApiEndpoint.post("withdrawApproval", "/instance/organization/domains/:domainId/revoke", {
      params,
      payload: DomainRevisionRequest,
      success: PublicOrganizationDomain,
      error: errors,
    }),
    HttpApiEndpoint.get("list", "/organization/domains", {
      success: OrganizationDomainList,
      error: errors,
    }),
    HttpApiEndpoint.post("create", "/organization/domains", {
      payload: CreateDomainRequest,
      success: PublicOrganizationDomain,
      error: errors,
    }),
    HttpApiEndpoint.post("request", "/organization/domains/:domainId/verification/request", {
      params,
      payload: DomainRevisionRequest,
      success: DomainChallenge,
      error: errors,
    }),
    HttpApiEndpoint.post("verify", "/organization/domains/:domainId/verification/confirm", {
      params,
      payload: DomainRevisionRequest,
      success: PublicOrganizationDomain,
      error: errors,
    }),
    HttpApiEndpoint.delete("revoke", "/organization/domains/:domainId", {
      params,
      payload: DomainRevisionRequest,
      success: PublicOrganizationDomain,
      error: errors,
    }),
    HttpApiEndpoint.post("approve", "/instance/organization/domains/:domainId/approve", {
      params,
      payload: DomainRevisionRequest,
      success: PublicOrganizationDomain,
      error: errors,
    }),
    HttpApiEndpoint.get(
      "connectionDomains",
      "/organization/identity-connections/:connectionId/domains",
      { params: connection, success: ConnectionDomains, error: errors },
    ),
    HttpApiEndpoint.put("bind", "/organization/identity-connections/:connectionId/domains", {
      params: connection,
      payload: ConnectionDomainsRequest,
      success: ConnectionDomains,
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .annotate(OpenApi.Title, "Enterprise domain verification") {}
