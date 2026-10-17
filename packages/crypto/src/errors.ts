import { Schema } from "effect";

export class CryptoError extends Schema.TaggedError<CryptoError>()("CryptoError", {
  operation: Schema.Literals(["random", "digest", "encrypt", "decrypt", "fingerprint"]),
}) {
  override readonly message = "Cryptographic operation failed";
}
