export const cryptoPurpose = {
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
  | typeof cryptoPurpose.bootstrapToken
  | typeof cryptoPurpose.sessionToken
  | typeof cryptoPurpose.emailSignInLink
  | typeof cryptoPurpose.emailSignInBrowser;
export type EncryptionPurpose = typeof cryptoPurpose.emailOutbox;
export type FingerprintPurpose =
  | typeof cryptoPurpose.emailOutboxFingerprint
  | typeof cryptoPurpose.setupVerificationCode
  | typeof cryptoPurpose.emailSignInCode
  | typeof cryptoPurpose.emailSignInRecipient;
