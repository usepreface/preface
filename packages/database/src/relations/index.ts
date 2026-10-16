import { defineRelations } from "drizzle-orm";

import { installation, instanceOwner, instanceSettings } from "#/schema/instance/index";

export const relations = defineRelations(
  { installation, instanceSettings, instanceOwner },
  (r) => ({
    installation: {
      settings: r.one.instanceSettings({
        from: r.installation.id,
        to: r.instanceSettings.installationId,
      }),
      owners: r.many.instanceOwner({ from: r.installation.id, to: r.instanceOwner.installationId }),
    },
    instanceSettings: {
      installation: r.one.installation({
        from: r.instanceSettings.installationId,
        to: r.installation.id,
        optional: false,
      }),
    },
    instanceOwner: {
      installation: r.one.installation({
        from: r.instanceOwner.installationId,
        to: r.installation.id,
        optional: false,
      }),
    },
  }),
);
