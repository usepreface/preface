import { Schema, SchemaGetter } from "effect";

export const DomainName = Schema.String.check(
  Schema.isMaxLength(253),
  Schema.isPattern(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
  ),
);

export const DomainNameInput = Schema.String.pipe(
  Schema.decodeTo(DomainName, {
    decode: SchemaGetter.transform((value) => value.trim().toLowerCase()),
    encode: SchemaGetter.passthrough(),
  }),
);
