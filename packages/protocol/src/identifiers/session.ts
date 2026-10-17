import { Schema } from "effect";

export const SessionId = Schema.String.check(Schema.isUUID(7)).pipe(Schema.brand("SessionId"));
export type SessionId = typeof SessionId.Type;
