import { credentialCookie } from "#/http/cookies/credential";

export const invitationCookieName = "preface_invitation";
export const {
  read: readInvitationCookie,
  set: setInvitationCookie,
  clear: clearInvitationCookie,
} = credentialCookie(invitationCookieName);
