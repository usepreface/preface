import { Schema } from "effect";

export const ConnectionStatus = Schema.Literals(["draft", "tested", "active", "disabled"]);

export const AuthFlowIntent = Schema.Literals([
  "sign_in",
  "link",
  "reauthenticate",
  "test",
  "accept_invitation",
]);
export type AuthFlowIntent = typeof AuthFlowIntent.Type;

export const GoogleConfiguration = Schema.Struct({
  version: Schema.Literal(1),
  clientId: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(512), Schema.isTrimmed()),
});

export const IdentityRevision = Schema.Int.check(Schema.isGreaterThan(0));

// Completion paths stay relative to the configured, trusted application origin.
export const AuthenticationReturnPath = Schema.String.check(
  Schema.isMaxLength(2048),
  Schema.makeFilter(
    (value) =>
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.includes("\\") &&
      Array.from(value).every(
        (character) => character.charCodeAt(0) > 32 && character.charCodeAt(0) !== 127,
      ) &&
      !/%(?:0[ad]|5c)/i.test(value),
  ),
);

export const GoogleSubject = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(255),
  Schema.isPattern(/^[\x21-\x7e]+$/),
);
