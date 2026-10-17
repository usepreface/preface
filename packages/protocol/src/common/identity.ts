import { Schema } from "effect";
export const ConnectionStatus = Schema.Literals(["draft", "tested", "active", "disabled"]);
export const AuthFlowIntent = Schema.Literals(["sign_in", "link", "reauthenticate", "test"]);
export type AuthFlowIntent = typeof AuthFlowIntent.Type;
export const GoogleConfiguration = Schema.Struct({
  version: Schema.Literal(1),
  clientId: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(512), Schema.isTrimmed()),
});
export const IdentityRevision = Schema.Int.check(Schema.isGreaterThan(0));
// Backend-only navigation currently has one supported destination. Extend with real client routes.
export const AuthenticationReturnPath = Schema.Literal("/api/docs");
export const GoogleSubject = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(255),
  Schema.isPattern(/^[\x21-\x7e]+$/),
);
