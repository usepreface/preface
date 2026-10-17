import { Schema } from "effect";

export const EmailJobId = Schema.String.check(Schema.isUUID(7)).pipe(Schema.brand("EmailJobId"));
export type EmailJobId = typeof EmailJobId.Type;
