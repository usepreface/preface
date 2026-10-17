import { Schema } from "effect";

import { DisplayNameInput } from "#/common/display-name";
import { EmailAddressInput } from "#/common/email";
import { SecretTokenFromString } from "#/common/secret-token";
import { VerificationCodeFromString } from "#/common/verification-code";
import { BootstrapChallengeId } from "#/identifiers/bootstrap";

export const RequestBootstrapVerificationInput = Schema.Struct({
  token: SecretTokenFromString,
  instanceName: DisplayNameInput,
  ownerName: DisplayNameInput,
  email: EmailAddressInput,
});
export type RequestBootstrapVerificationInput = typeof RequestBootstrapVerificationInput.Type;

export const CompleteBootstrapInput = Schema.Struct({
  token: SecretTokenFromString,
  challengeId: BootstrapChallengeId,
  code: VerificationCodeFromString,
});
export type CompleteBootstrapInput = typeof CompleteBootstrapInput.Type;

export const ResendBootstrapVerificationInput = Schema.Struct({
  token: SecretTokenFromString,
  challengeId: BootstrapChallengeId,
});
export type ResendBootstrapVerificationInput = typeof ResendBootstrapVerificationInput.Type;
