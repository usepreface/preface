# @usepreface/crypto

Shared credential cryptography for Preface on Node.js 24 and Effect v4. Owns secure
randomness, purpose-separated token digests, keyed fingerprints and authenticated
payload encryption. Workflows own recipients, expiry, attempts and authorization.

`TokenCrypto` provides `randomToken`, `randomCode`, `digestToken` and `verifyToken`.
It requires only Effect's platform `Crypto.Crypto`, without deployment secrets.
Random tokens contain 32 random bytes; codes contain eight independent decimal digits.
Raw generated values are `Redacted`.

`SecretCrypto` provides `encrypt`, `decrypt`, `fingerprint` and `verifyFingerprint`.
Plaintext and recovered secrets are redacted. Select a stable code-owned domain
from `cryptoPurpose`. Short codes require keyed fingerprints, not bare token hashes.

The `/node` entry exports `NodeTokenCrypto.layer` and `NodeSecretCrypto.layer`.
Supply `NodeCrypto.layer` from `@effect/platform-node` at the runtime boundary.
Importing the package does not acquire configuration or generate keys.

| Variable                | Meaning                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `CRYPTO_ENCRYPTION_KEY` | Required 32-byte standard-base64 AES-GCM key.                          |
| `CRYPTO_HMAC_KEY`       | Required independent 32-byte standard-base64 fingerprint key.          |
| `EMAIL_ENCRYPTION_KEY`  | Legacy encryption-key fallback when `CRYPTO_ENCRYPTION_KEY` is absent. |

Keep the encryption key unchanged when renaming its variable. Bootstrap/session
prefixes and SHA-256 digest framing remain compatible. The existing outbox's
versioned AES-256-GCM ciphertext and keyed fingerprint remain compatible; that
legacy fingerprint purpose still derives its key from the encryption root. New
verification-code fingerprints derive from `CRYPTO_HMAC_KEY`.

Generate each key separately and store it in deployment secrets:

```sh
node --input-type=module -e 'import { randomBytes } from "node:crypto"; console.log(randomBytes(32).toString("base64"))'
```

Back up keys with the database. Ciphertext versioning is not key rotation; key rings
and rotation workflows are not implemented. Errors omit plaintext and native causes.
Keep raw credentials, keys and decrypted payloads out of routine logs.

```sh
pnpm --filter @usepreface/crypto typecheck
pnpm --filter @usepreface/crypto lint
pnpm --filter @usepreface/crypto test
pnpm --filter @usepreface/crypto build
```
