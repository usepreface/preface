export const cryptoPurpose = {
  externalIdentityProof: "preface/external-identity/proof/v1",
  externalEmailCode: "preface/external-identity/email-code/v1",
  externalEmailSubject: "preface/external-identity/email-subject/v1",
  domainChallenge: "preface/domain/challenge/v1",
  samlFlow: "preface/saml/flow/v1",
  samlRelay: "preface/saml/relay/v1",
  samlBrowser: "preface/saml/browser/v1",
  samlReplay: "preface/saml/replay/v1",
  samlSubject: "preface/saml/subject/v1",
  organizationAuthRecovery: "preface/organization/auth-recovery/v1",
  identityConnection: "preface/identity/connection/v1",
  authFlowVerifier: "preface/identity/pkce/v1",
  authFlowState: "preface/identity/state/v1",
  authFlowBrowser: "preface/identity/browser/v1",
  authFlowNonce: "preface/identity/nonce/v1",
  emailReauthenticationLink: "preface/email-reauthentication/link/v1",
  emailReauthenticationBrowser: "preface/email-reauthentication/browser/v1",
  emailReauthenticationCode: "preface/email-reauthentication/code/v1",
  emailReauthenticationSubject: "preface/email-reauthentication/subject/v1",
  invitationToken: "preface/invitation/token/v1",
  invitationBrowser: "preface/invitation/browser/v1",
  invitationLink: "preface/invitation/link/v1",
  invitationCode: "preface/invitation/code/v1",
  invitationRecipient: "preface/invitation/recipient/v1",
  emailSignInLink: "preface/email-sign-in/link/v1",
  emailSignInBrowser: "preface/email-sign-in/browser/v1",
  emailSignInCode: "preface/email-sign-in/code/v1",
  emailSignInRecipient: "preface/email-sign-in/recipient/v1",
  bootstrapToken: "preface:bootstrap:v1",
  sessionToken: "preface:session:v1",
  emailOutbox: "preface/email-outbox/v1",
  emailOutboxFingerprint: "preface/email-outbox/fingerprint/v1",
  setupVerificationCode: "preface/instance-setup/code/v1",
} as const;

export type TokenPurpose =
  | typeof cryptoPurpose.domainChallenge
  | typeof cryptoPurpose.samlRelay
  | typeof cryptoPurpose.samlBrowser
  | typeof cryptoPurpose.samlReplay
  | typeof cryptoPurpose.samlSubject
  | typeof cryptoPurpose.organizationAuthRecovery
  | typeof cryptoPurpose.authFlowState
  | typeof cryptoPurpose.authFlowBrowser
  | typeof cryptoPurpose.authFlowNonce
  | typeof cryptoPurpose.emailReauthenticationLink
  | typeof cryptoPurpose.emailReauthenticationBrowser
  | typeof cryptoPurpose.invitationToken
  | typeof cryptoPurpose.invitationBrowser
  | typeof cryptoPurpose.invitationLink
  | typeof cryptoPurpose.bootstrapToken
  | typeof cryptoPurpose.sessionToken
  | typeof cryptoPurpose.emailSignInLink
  | typeof cryptoPurpose.emailSignInBrowser;
export type EncryptionPurpose =
  | typeof cryptoPurpose.externalIdentityProof
  | typeof cryptoPurpose.samlFlow
  | typeof cryptoPurpose.emailOutbox
  | typeof cryptoPurpose.identityConnection
  | typeof cryptoPurpose.authFlowVerifier;
export type FingerprintPurpose =
  | typeof cryptoPurpose.externalEmailCode
  | typeof cryptoPurpose.externalEmailSubject
  | typeof cryptoPurpose.emailReauthenticationCode
  | typeof cryptoPurpose.emailReauthenticationSubject
  | typeof cryptoPurpose.invitationCode
  | typeof cryptoPurpose.invitationRecipient
  | typeof cryptoPurpose.emailOutboxFingerprint
  | typeof cryptoPurpose.setupVerificationCode
  | typeof cryptoPurpose.emailSignInCode
  | typeof cryptoPurpose.emailSignInRecipient;
