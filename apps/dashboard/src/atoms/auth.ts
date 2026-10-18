import { mutation } from "./client";
import { QueryKeys as K } from "./query-keys";

export const instanceSetupInspectMutation = mutation(
  (client) => client.instanceSetup.inspect,
  () => [],
);
export const instanceSetupRequestVerificationMutation = mutation(
  (client) => client.instanceSetup.requestVerification,
  () => [],
);
export const instanceSetupResendVerificationMutation = mutation(
  (client) => client.instanceSetup.resendVerification,
  () => [],
);
export const instanceSetupCompleteMutation = mutation(
  (client) => client.instanceSetup.complete,
  () => [],
);
export const emailSignInRequestMutation = mutation(
  (client) => client.emailSignIn.request,
  () => [],
);
export const emailSignInResendMutation = mutation(
  (client) => client.emailSignIn.resend,
  () => [],
);
export const emailSignInVerifyMutation = mutation(
  (client) => client.emailSignIn.verify,
  () => [],
);
export const authenticationDiscoveryDiscoverMutation = mutation(
  (client) => client.authenticationDiscovery.discover,
  () => [],
);
export const googleStartMutation = mutation(
  (client) => client.google.start,
  () => [],
);
export const reauthenticationRequestEmailMutation = mutation(
  (client) => client.reauthentication.requestEmail,
  () => [],
);
export const reauthenticationResendEmailMutation = mutation(
  (client) => client.reauthentication.resendEmail,
  () => [],
);
export const reauthenticationVerifyEmailMutation = mutation(
  (client) => client.reauthentication.verifyEmail,
  () => [K.account, K.authority],
);
export const reauthenticationStartGoogleMutation = mutation(
  (client) => client.reauthentication.startGoogle,
  () => [],
);
export const accountsStartGoogleMutation = mutation(
  (client) => client.accounts.startGoogle,
  () => [K.account, K.authority],
);
export const accountsUnlinkMutation = mutation(
  (client) => client.accounts.unlink,
  () => [K.account, K.authority],
);
export const sessionsRevokeMutation = mutation(
  (client) => client.sessions.revoke,
  () => [K.account],
);
export const sessionsRevokeAllMutation = mutation(
  (client) => client.sessions.revokeAll,
  () => [K.account],
);
export const profileUpdateMutation = mutation(
  (client) => client.profile.update,
  () => [K.account, K.authority],
);
export const invitationsInspectMutation = mutation(
  (client) => client.invitations.inspect,
  () => [],
);
export const invitationsRequestVerificationMutation = mutation(
  (client) => client.invitations.requestVerification,
  () => [],
);
export const invitationsAcceptMutation = mutation(
  (client) => client.invitations.accept,
  () => [],
);
export const externalAuthenticationStartInvitationMutation = mutation(
  (client) => client.externalAuthentication.startInvitation,
  () => [],
);
export const externalAuthenticationRequestEmailMutation = mutation(
  (client) => client.externalAuthentication.requestEmail,
  () => [],
);
export const externalAuthenticationVerifyEmailMutation = mutation(
  (client) => client.externalAuthentication.verifyEmail,
  () => [],
);
export const externalAuthenticationResumeMutation = mutation(
  (client) => client.externalAuthentication.resume,
  () => [],
);
export const oidcStartMutation = mutation(
  (client) => client.oidc.start,
  () => [],
);
