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
verification-code fingerprints derive from `CRYPTO_HMAC_KEY`. Email sign-in adds
separate purposes for link and browser token digests, challenge-bound code HMACs,
and recipient HMACs used to coordinate pending proofs without storing unknown emails.

Invitation tokens, browser bindings, link proofs, challenge-bound codes and
invitation-version subjects have separate purposes in the same services.

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

Google flows add separate purposes for state/browser/nonce digests, encrypted connection
credentials and temporary PKCE context. `TokenCrypto.pkceChallenge(verifier)` returns the standard
S256 base64url challenge using platform crypto. Email reauthentication has independent browser,
link, challenge-code and session-subject purposes. Application envelopes bind recoverable
credentials to connection/revision or flow identity; this package does not decide account policy.

Organization offline recovery uses `cryptoPurpose.organizationAuthRecovery` with the existing
32-byte `randomToken`, `digestToken` and `verifyToken` operations. Application owns owner binding,
single use, rotation and recovery policy; raw credentials remain redacted outside explicit issuance.

## Signing certificates

`CertificateCrypto` provides `generateSigningCertificate()` and
`validateSigningCertificates(certificates)`. Supply `NodeCertificateCrypto.layer` from the Node
entry. Generation returns a redacted PKCS8 private key, PEM certificate and expiry; it uses
RSA-2048/SHA256 with one-year validity. Validation normalizes currently valid RSA-2048-or-stronger
certificates. Application owns storage, trust, rollover and renewal. The focused X.509 dependency
creates certificates because Node's built-in crypto can parse but cannot issue them.

SAML adds separate purposes for RelayState/browser digests, hashed stable subjects, replay IDs
and encrypted staged flow proofs. Never expose signing private keys or decrypted assertions.

`CertificateCrypto.inspectSigningCertificate` returns a public SHA-256 fingerprint and validity dates,
including for expired certificates. It does not assert that the certificate is currently usable.
Signing validation remains a separate operation. Pending connection keys use a separate encryption
purpose and are bound to their connection/revision by the application envelope.
