import { Schema } from "effect";

export const UserId = Schema.String.check(Schema.isUUID(7)).pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;
