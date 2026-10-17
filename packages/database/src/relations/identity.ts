import { defineRelationsPart } from "drizzle-orm";

import * as schema from "#/schema/index";
export const identityRelations = defineRelationsPart(schema, (r) => ({
  identityConnection: {
    installation: r.one.installation({
      from: r.identityConnection.installationId,
      to: r.installation.id,
      optional: true,
    }),
    organization: r.one.organization({
      from: r.identityConnection.organizationId,
      to: r.organization.id,
      optional: true,
    }),
  },
  organizationAuthPolicyConnection: {
    connection: r.one.identityConnection({
      from: [
        r.organizationAuthPolicyConnection.identityConnectionId,
        r.organizationAuthPolicyConnection.organizationId,
      ],
      to: [r.identityConnection.id, r.identityConnection.organizationId],
      optional: false,
    }),
    policy: r.one.organizationAuthPolicy({
      from: r.organizationAuthPolicyConnection.organizationId,
      to: r.organizationAuthPolicy.organizationId,
      optional: false,
    }),
  },
  account: {
    user: r.one.user({ from: r.account.userId, to: r.user.id, optional: false }),
    connection: r.one.identityConnection({
      from: r.account.identityConnectionId,
      to: r.identityConnection.id,
      optional: false,
    }),
  },
  ssoReplay: {
    connection: r.one.identityConnection({
      from: r.ssoReplay.identityConnectionId,
      to: r.identityConnection.id,
      optional: false,
    }),
  },
  authFlow: {
    connection: r.one.identityConnection({
      from: r.authFlow.identityConnectionId,
      to: r.identityConnection.id,
      optional: false,
    }),
  },
}));
