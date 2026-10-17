# Shared cryptography

`packages/crypto` owns reusable credential and payload mechanisms. Application
workflows own token prefixes, lifetimes, attempts, recipients and authority;
email owns payload serialization and its queue lifecycle. The crypto package has
no persistence, application or transport dependency.

`TokenCrypto` provides keyless randomness and purpose-separated token digests.
`SecretCrypto` provides keyed fingerprints and authenticated encryption. This
separation lets session/bootstrap primitives operate without acquiring unrelated
payload encryption configuration. The Node composition supplies platform crypto.
Raw generated credentials and decrypted values remain redacted.

Application `TokenService` preserves its existing API and delegates primitives to
`TokenCrypto`. Prefixes `bs1` and `ss1`, digest framing and hex encoding remain
unchanged, so moving implementations does not invalidate stored credentials.
`EmailPayloadCipher` supplies fixed purposes to `SecretCrypto` and translates
failures into email errors; it no longer owns encryption implementation.

AES-256-GCM retains the existing `v1.nonce.body.tag` encoding and authenticates the
purpose as additional data. The legacy outbox fingerprint keeps its encryption-root
derivation for compatibility. New verification fingerprints use the independent
HMAC root and a stable purpose. Callers bind low-entropy verification codes to the
challenge identity before fingerprinting; bare SHA-256 is for high-entropy tokens.

`CRYPTO_ENCRYPTION_KEY` replaces `EMAIL_ENCRYPTION_KEY`, with the old name accepted
only when the new one is absent. Keep the value unchanged during a rename.
`CRYPTO_HMAC_KEY` is an independent secret. Versioning does not provide automatic
key rotation; back up keys with the database and do not replace them as a side
effect of deployment. Exact configuration belongs in the
[package README](../../packages/crypto/README.md).

Compatibility tests use independent Node hash/HMAC and AES constructions to verify
old credential framing, ciphertext decryption, fingerprint stability, tampering
rejection and challenge-bound keyed verification. Existing application/email suites
exercise the migrated consumers.

## Source

- [Service exports](../../packages/crypto/src/index.ts)
- [Node implementations](../../packages/crypto/src/node/index.ts)
- [Purposes](../../packages/crypto/src/purposes.ts)
- [Application adapter](../../packages/application/src/node/token.ts)
- [Email adapter](../../packages/emails/src/cipher.ts)
- [Compatibility tests](../../packages/crypto/tests/unit/compatibility.test.ts)
