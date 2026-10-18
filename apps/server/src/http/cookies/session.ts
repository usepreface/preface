import { sessionCookieName } from "@usepreface/api";

import { credentialCookie } from "#/http/cookies/credential";

export const {
  read: readSessionCookie,
  set: setSessionCookie,
  clear: clearSessionCookie,
} = credentialCookie(sessionCookieName);
