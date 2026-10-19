import { defineRelationsPart } from "drizzle-orm";

import * as schema from "#/schema/index";

export const instanceRelations = defineRelationsPart(schema, (r) => ({
  installation: {
    organization: r.one.organization({
      from: r.installation.id,
      to: r.organization.installationId,
    }),
    bootstrapChallenge: r.one.bootstrapChallenge({
      from: r.installation.id,
      to: r.bootstrapChallenge.installationId,
    }),
    settings: r.one.instanceSettings({
      from: r.installation.id,
      to: r.instanceSettings.installationId,
    }),
    owners: r.many.instanceOwner({ from: r.installation.id, to: r.instanceOwner.installationId }),
  },
  bootstrapChallenge: {
    installation: r.one.installation({
      from: r.bootstrapChallenge.installationId,
      to: r.installation.id,
      optional: false,
    }),
    emailJob: r.one.emailJob({
      from: r.bootstrapChallenge.emailJobId,
      to: r.emailJob.id,
      optional: false,
    }),
  },
  instanceSettings: {
    installation: r.one.installation({
      from: r.instanceSettings.installationId,
      to: r.installation.id,
      optional: false,
    }),
  },
  instanceOwner: {
    user: r.one.user({ from: r.instanceOwner.userId, to: r.user.id, optional: false }),
    grantedBy: r.one.user({ from: r.instanceOwner.grantedByUserId, to: r.user.id }),
    revokedBy: r.one.user({ from: r.instanceOwner.revokedByUserId, to: r.user.id }),
    installation: r.one.installation({
      from: r.instanceOwner.installationId,
      to: r.installation.id,
      optional: false,
    }),
  },
}));
