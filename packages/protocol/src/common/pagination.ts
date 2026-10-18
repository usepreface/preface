import { Schema } from "effect";

export const PageSize = Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 }));
