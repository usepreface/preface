import { defineRelationsPart } from "drizzle-orm";

import * as schema from "#/schema/index";
export const identityRelations = defineRelationsPart(schema, (r) => ({
  identityConnection: {
    installation: r.one.installation({
      from: r.identityConnection.installationId,
      to: r.installation.id,
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
  authFlow: {
    connection: r.one.identityConnection({
      from: r.authFlow.identityConnectionId,
      to: r.identityConnection.id,
      optional: false,
    }),
  },
}));
