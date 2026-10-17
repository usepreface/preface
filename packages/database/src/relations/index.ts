import { defineRelations } from "drizzle-orm";

import { auditEvent } from "#/schema/audit/index";
import { passwordCredential, session, user } from "#/schema/auth/index";
import { installation, instanceOwner, instanceSettings } from "#/schema/instance/index";

export const relations = defineRelations(
  { installation, instanceSettings, instanceOwner, user, passwordCredential, session, auditEvent },
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
      user: r.one.user({ from: r.instanceOwner.userId, to: r.user.id, optional: false }),
      grantedBy: r.one.user({ from: r.instanceOwner.grantedByUserId, to: r.user.id }),
      revokedBy: r.one.user({ from: r.instanceOwner.revokedByUserId, to: r.user.id }),
      installation: r.one.installation({
        from: r.instanceOwner.installationId,
        to: r.installation.id,
        optional: false,
      }),
    },
    user: {
      passwordCredential: r.one.passwordCredential({
        from: r.user.id,
        to: r.passwordCredential.userId,
      }),
      sessions: r.many.session({ from: r.user.id, to: r.session.userId }),
      ownerGrants: r.many.instanceOwner({ from: r.user.id, to: r.instanceOwner.userId }),
      auditEvents: r.many.auditEvent({ from: r.user.id, to: r.auditEvent.actorUserId }),
    },
    passwordCredential: {
      user: r.one.user({ from: r.passwordCredential.userId, to: r.user.id, optional: false }),
    },
    session: {
      user: r.one.user({ from: r.session.userId, to: r.user.id, optional: false }),
    },
    auditEvent: {
      actor: r.one.user({ from: r.auditEvent.actorUserId, to: r.user.id }),
    },
  }),
);
