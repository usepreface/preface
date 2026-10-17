export const cryptoPurpose = {
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
  | typeof cryptoPurpose.invitationToken
  | typeof cryptoPurpose.invitationBrowser
  | typeof cryptoPurpose.invitationLink
  | typeof cryptoPurpose.bootstrapToken
  | typeof cryptoPurpose.sessionToken
  | typeof cryptoPurpose.emailSignInLink
  | typeof cryptoPurpose.emailSignInBrowser;
export type EncryptionPurpose = typeof cryptoPurpose.emailOutbox;
export type FingerprintPurpose =
  | typeof cryptoPurpose.invitationCode
  | typeof cryptoPurpose.invitationRecipient
  | typeof cryptoPurpose.emailOutboxFingerprint
  | typeof cryptoPurpose.setupVerificationCode
  | typeof cryptoPurpose.emailSignInCode
  | typeof cryptoPurpose.emailSignInRecipient;
