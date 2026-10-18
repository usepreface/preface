# Identity provider compatibility

Preface uses `openid-client` for OIDC and `@node-saml/node-saml` for SAML protocol verification.
Each configured connection must complete its own owner-bound test before activation. A successful
protocol login establishes identity, not membership; admission and account linking follow
[external enrollment](enrollment.md).

| Provider/profile                      | Verification evidence                                                                                                                       | Limits                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google OpenID Connect                 | Signed-token SDK fixtures and invitation/linking workflow tests                                                                             | Requires operator credentials for a live Google test; Gmail or signed Workspace domain supplies email authority                                    |
| OIDC authorization code               | SDK fixtures cover PKCE, nonce, issuer/audience and authentication age; application tests cover enrollment, linking and revocation          | RSA-SHA256 tokens, exact HTTPS issuer/discovery, configured client authentication; no arbitrary provider-profile claim                             |
| SAML Redirect request / POST response | Real SDK signature fixtures and application tests cover stable NameID, configured signed email, replay, browser completion and key rollover | Both Response and Assertion signatures required; persistent or explicitly unspecified NameID; no encrypted assertions, unsolicited response or SLO |

OIDC network access pins DNS resolution and denies private networks unless the operator explicitly
allows an exact private HTTPS origin. TLS validation remains enabled for allowed private origins.
SAML metadata is supplied by the owner, not fetched from an arbitrary URL. SHA-1 signatures and XML
entity declarations remain rejected. An IdP application tile should send the user into a fresh
SP-initiated login; unsolicited assertions are not accepted.

Vendor tenant checks require actual test credentials. Okta and Entra are not certified or claimed
verified by synthetic fixtures. Add verified local-provider results here after the real interoperability
lane runs; keep profile and configuration requirements explicit.
