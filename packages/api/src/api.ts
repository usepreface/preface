import { HttpApi, OpenApi } from "effect/http-api";

import { AuditApi } from "#/groups/audit";
import { AccountsApi } from "#/groups/auth/accounts";
import {
  AuthenticationDiscoveryApi,
  CurrentOrganizationAuthenticationApi,
} from "#/groups/auth/discovery";
import { EmailSignInApi } from "#/groups/auth/email-sign-in";
import { ExternalAuthenticationApi } from "#/groups/auth/external";
import { GoogleApi } from "#/groups/auth/google";
import { InvitationsApi } from "#/groups/auth/invitations";
import { OidcApi } from "#/groups/auth/oidc";
import { SamlApi } from "#/groups/auth/saml";
import { SessionApi } from "#/groups/auth/session";
import { SessionsApi } from "#/groups/auth/sessions";
import { InstanceCapabilitiesApi } from "#/groups/instance/capabilities";
import { IdentityConnectionsApi } from "#/groups/instance/identity-connections";
import { InstanceSetupApi } from "#/groups/instance/setup";
import { OrganizationAuthRecoveryApi } from "#/groups/organization/auth-recovery";
import { AuthenticationPolicyApi } from "#/groups/organization/authentication-policy";
import { ConnectionOperationsApi } from "#/groups/organization/connection-operations";
import { OrganizationDomainsApi } from "#/groups/organization/domains";
import { OrganizationIdentityConnectionsApi } from "#/groups/organization/identity-connections";
import { OrganizationInvitationsApi } from "#/groups/organization/invitations";
import { OrganizationMembersApi } from "#/groups/organization/members";
import { OrganizationsApi } from "#/groups/organization/organizations";
import { OrganizationOwnershipApi } from "#/groups/organization/ownership";
import { OrganizationRoleBindingsApi } from "#/groups/organization/role-bindings";
import { OrganizationRolesApi } from "#/groups/organization/roles";
import { TeamsApi } from "#/groups/organization/teams";
import { ProfileApi } from "#/groups/profile";

export class PrefaceApi extends HttpApi.make("PrefaceApi")
  .add(
    ConnectionOperationsApi,
    AuditApi,
    AuthenticationDiscoveryApi,
    CurrentOrganizationAuthenticationApi,
    ExternalAuthenticationApi,
    OrganizationDomainsApi,
    OidcApi,
    SamlApi,
    OrganizationIdentityConnectionsApi,
    GoogleApi,
    IdentityConnectionsApi,
    AccountsApi,
    AuthenticationPolicyApi,
    OrganizationAuthRecoveryApi,
    TeamsApi,
    ProfileApi,
    InstanceSetupApi,
    SessionApi,
    EmailSignInApi,
    InvitationsApi,
    OrganizationInvitationsApi,
    SessionsApi,
    OrganizationsApi,
    OrganizationMembersApi,
    OrganizationRolesApi,
    OrganizationRoleBindingsApi,
    OrganizationOwnershipApi,
    InstanceCapabilitiesApi,
  )
  .prefix("/api/v1")
  .annotateMerge(
    OpenApi.annotations({
      title: "Preface API",
      version: "1.0.0",
      description:
        "Instance setup, email sign-in, sessions and organization administration for self-hosted Preface.",
      license: { name: "Apache-2.0", url: "https://www.apache.org/licenses/LICENSE-2.0" },
      servers: [{ url: "/", description: "This Preface installation" }],
    }),
  ) {}
