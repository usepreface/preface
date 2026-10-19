import { defineRelationsPart } from "drizzle-orm";

import * as schema from "#/schema/index";
export const identityRelations = defineRelationsPart(schema, (r) => ({
  identityConnectionKey: {
    connection: r.one.identityConnection({
      from: [r.identityConnectionKey.identityConnectionId, r.identityConnectionKey.organizationId],
      to: [r.identityConnection.id, r.identityConnection.organizationId],
      optional: false,
    }),
  },
  organizationDomain: {
    organization: r.one.organization({
      from: r.organizationDomain.organizationId,
      to: r.organization.id,
      optional: false,
    }),
  },
  identityConnectionDomain: {
    domain: r.one.organizationDomain({
      from: [r.identityConnectionDomain.domainId, r.identityConnectionDomain.organizationId],
      to: [r.organizationDomain.id, r.organizationDomain.organizationId],
      optional: false,
    }),
    connection: r.one.identityConnection({
      from: [
        r.identityConnectionDomain.identityConnectionId,
        r.identityConnectionDomain.organizationId,
      ],
      to: [r.identityConnection.id, r.identityConnection.organizationId],
      optional: false,
    }),
  },
  identityConnection: {
    organization: r.one.organization({
      from: r.identityConnection.organizationId,
      to: r.organization.id,
      optional: false,
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
