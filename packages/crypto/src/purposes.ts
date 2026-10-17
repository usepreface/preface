export const cryptoPurpose = {
  bootstrapToken: "preface:bootstrap:v1",
  sessionToken: "preface:session:v1",
  emailOutbox: "preface/email-outbox/v1",
  emailOutboxFingerprint: "preface/email-outbox/fingerprint/v1",
  setupVerificationCode: "preface/instance-setup/code/v1",
} as const;

export type TokenPurpose = typeof cryptoPurpose.bootstrapToken | typeof cryptoPurpose.sessionToken;
export type EncryptionPurpose = typeof cryptoPurpose.emailOutbox;
export type FingerprintPurpose =
  | typeof cryptoPurpose.emailOutboxFingerprint
  | typeof cryptoPurpose.setupVerificationCode;
