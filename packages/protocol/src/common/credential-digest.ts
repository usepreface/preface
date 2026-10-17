import { Schema } from "effect";

export const CredentialDigest = Schema.String.check(Schema.isPattern(/^[0-9a-f]{64}$/));
