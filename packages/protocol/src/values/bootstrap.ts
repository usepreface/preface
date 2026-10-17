import { Schema } from "effect";

export const BootstrapPasswordValue = Schema.String.check(
  Schema.isMinLength(15),
  Schema.isMaxLength(128),
);
