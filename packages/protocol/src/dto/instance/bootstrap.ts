import { Schema } from "effect";

import { DisplayName } from "#/common/display-name";
import { SecretTokenFromString } from "#/common/secret-token";
import { VerificationCode } from "#/common/verification-code";
import { BootstrapChallengeId } from "#/identifiers/bootstrap";

const token = Schema.toEncoded(SecretTokenFromString).annotate({
  writeOnly: true,
  description: "Current one-time operator setup proof.",
});

export const RequestBootstrapVerificationRequest = Schema.Struct({
  token,
  organizationName: Schema.String.annotate({
    description: "Organization display name; trimmed to 1–120 characters.",
  }),
  ownerName: Schema.String.annotate({
    description: "First owner's display name; trimmed to 1–120 characters.",
  }),
  email: Schema.String.annotate({
    description: "Account email; trimmed and lowercased on the server.",
  }),
}).annotate({ identifier: "RequestBootstrapVerificationRequest" });
export type RequestBootstrapVerificationRequest = typeof RequestBootstrapVerificationRequest.Type;

export const CompleteBootstrapRequest = Schema.Struct({
  token,
  challengeId: BootstrapChallengeId,
  code: VerificationCode.annotate({
    writeOnly: true,
    description: "Eight-digit verification code from the setup email.",
  }),
}).annotate({ identifier: "CompleteBootstrapRequest" });
export type CompleteBootstrapRequest = typeof CompleteBootstrapRequest.Type;

export const ResendBootstrapVerificationRequest = Schema.Struct({
  token,
  challengeId: BootstrapChallengeId,
});
export type ResendBootstrapVerificationRequest = typeof ResendBootstrapVerificationRequest.Type;

export const BootstrapVerification = Schema.Struct({
  challengeId: BootstrapChallengeId,
  expiresAt: Schema.DateTimeUtcFromString,
  resendAt: Schema.DateTimeUtcFromString,
});
export type BootstrapVerification = typeof BootstrapVerification.Type;

export const InspectBootstrapRequest = Schema.Struct({ token }).annotate({
  identifier: "InspectBootstrapRequest",
});
export type InspectBootstrapRequest = typeof InspectBootstrapRequest.Type;

export const BootstrapStatus = Schema.Struct({
  state: Schema.Literals(["setup_required", "ready"]),
  organizationName: DisplayName,
});
export type BootstrapStatus = typeof BootstrapStatus.Type;

export const BootstrapTokenInfo = Schema.Struct({ expiresAt: Schema.DateTimeUtcFromString });
export type BootstrapTokenInfo = typeof BootstrapTokenInfo.Type;
