import type { SessionActor } from "@usepreface/protocol/dto";
import type { AuthFlow } from "@usepreface/protocol/model";

export const matchesFlowActor = (flow: AuthFlow, actor?: SessionActor) =>
  flow.expectedUserId === null
    ? actor === undefined && (flow.intent === "sign_in" || flow.intent === "accept_invitation")
    : actor !== undefined &&
      actor.user.id === flow.expectedUserId &&
      actor.session.id === flow.initiatingSessionId;

export interface InvitationEnrollment {
  readonly invitationId: NonNullable<AuthFlow["invitationId"]>;
  readonly invitationRevision: number;
  readonly targetOrganizationId: NonNullable<AuthFlow["targetOrganizationId"]>;
  readonly displayName: string;
}
