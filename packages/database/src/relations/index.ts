import { defineRelations } from "drizzle-orm";

import { auditEvent } from "#/schema/audit/index";
import { session, user } from "#/schema/auth/index";
import { sessionAuthentication } from "#/schema/auth/session-authentication";
import { userEmail } from "#/schema/auth/user-email";
import { verification } from "#/schema/auth/verification";
import {
  installation,
  instanceOwner,
  instanceSettings,
  bootstrapChallenge,
} from "#/schema/instance/index";
import { emailJob } from "#/schema/jobs/email";

export const relations = defineRelations(
  {
    installation,
    instanceSettings,
    instanceOwner,
    user,
    session,
    auditEvent,
    emailJob,
    bootstrapChallenge,
    userEmail,
    verification,
    sessionAuthentication,
  },
  (r) => ({
    installation: {
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
    auditEvent: {
      actor: r.one.user({ from: r.auditEvent.actorUserId, to: r.user.id }),
    },
  }),
);
