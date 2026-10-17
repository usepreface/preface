import { Schema } from "effect";

export const InstanceDisplayName = Schema.String.check(
  Schema.isTrimmed(),
  Schema.isMinLength(1),
  Schema.isMaxLength(120),
);
