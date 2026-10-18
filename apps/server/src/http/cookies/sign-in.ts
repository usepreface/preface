import { credentialCookie } from "#/http/cookies/credential";

export const signInCookieName = "preface_sign_in";
export const {
  read: readSignInCookie,
  set: setSignInCookie,
  clear: clearSignInCookie,
} = credentialCookie(signInCookieName);
