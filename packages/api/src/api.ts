import { HttpApi, OpenApi } from "effect/http-api";

import { EmailSignInApi } from "#/groups/email-sign-in";
import { InstanceCapabilitiesApi } from "#/groups/instance-capabilities";
import { InstanceSetupApi } from "#/groups/instance-setup";
import { InvitationsApi } from "#/groups/invitations";
import { OrganizationInvitationsApi } from "#/groups/organization-invitations";
import { OrganizationMembersApi } from "#/groups/organization-members";
import { OrganizationOwnershipApi } from "#/groups/organization-ownership";
import { OrganizationRoleBindingsApi } from "#/groups/organization-role-bindings";
import { OrganizationRolesApi } from "#/groups/organization-roles";
import { OrganizationsApi } from "#/groups/organizations";
import { SessionApi } from "#/groups/session";
import { SessionsApi } from "#/groups/sessions";

export class PrefaceApi extends HttpApi.make("PrefaceApi")
  .add(
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
