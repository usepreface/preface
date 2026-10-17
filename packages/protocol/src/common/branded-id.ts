import { Schema } from "effect";

export const createBrandedId = <const Brand extends string>(
  brand: Parameters<typeof Schema.brand<Brand>>[0],
) => Schema.String.check(Schema.isUUID(7)).pipe(Schema.brand<Brand>(brand));
