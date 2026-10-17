import { defineRelationsPart } from "drizzle-orm";

import * as schema from "#/schema/index";

export const authRelations = defineRelationsPart(schema, (r) => ({
  userEmail: { user: r.one.user({ from: r.userEmail.userId, to: r.user.id, optional: false }) },
  verification: {
    emailJob: r.one.emailJob({ from: r.verification.emailJobId, to: r.emailJob.id }),
  },
  sessionAuthentication: {
    session: r.one.session({
      from: r.sessionAuthentication.sessionId,
      to: r.session.id,
      optional: false,
    }),
  },
  user: {
    emails: r.many.userEmail({ from: r.user.id, to: r.userEmail.userId }),
    sessions: r.many.session({ from: r.user.id, to: r.session.userId }),
    ownerGrants: r.many.instanceOwner({ from: r.user.id, to: r.instanceOwner.userId }),
    auditEvents: r.many.auditEvent({ from: r.user.id, to: r.auditEvent.actorUserId }),
  },
  session: {
    user: r.one.user({ from: r.session.userId, to: r.user.id, optional: false }),
  },
}));
