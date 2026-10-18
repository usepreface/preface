# Identity provider compatibility

Preface uses `openid-client` for OIDC and `@node-saml/node-saml` for SAML protocol verification.
Each configured connection must complete its own owner-bound test before activation. A successful
protocol login establishes identity, not membership; admission and account linking follow
[external enrollment](enrollment.md).

| Provider/profile                                      | Verification evidence                                                                                                                                                                                            | Limits                                                                                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google OpenID Connect                                 | Signed-token SDK fixtures and invitation/linking workflow tests                                                                                                                                                  | Requires operator credentials for a live Google test; Gmail or signed Workspace domain supplies email authority                                    |
| OIDC authorization code                               | SDK fixtures cover PKCE, nonce, issuer/audience and authentication age; application tests cover enrollment, linking and revocation                                                                               | RSA-SHA256 tokens, exact HTTPS issuer/discovery, configured client authentication; no arbitrary provider-profile claim                             |
| Keycloak 26.8.1 OIDC                                  | Disposable realm over trusted local TLS: PKCE S256, client_secret_basic, owner test/activation, invited first login, secure cookie, dashboard-origin redirect and organization access                            | Requires the exact configured issuer and an approved private HTTPS origin for a local deployment                                                   |
| Keycloak 26.8.1 SAML Redirect request / POST response | Disposable realm over trusted local TLS: signed requests, both signatures, persistent NameID, signed `email` mapping, owner test/activation, invited first login, cookie-bound completion and staged SP rollover | Both Response and Assertion signatures required; persistent or explicitly unspecified NameID; no encrypted assertions, unsolicited response or SLO |

OIDC network access pins DNS resolution and denies private networks unless the operator explicitly
allows an exact private HTTPS origin. TLS validation remains enabled for allowed private origins.
SAML metadata is supplied by the owner, not fetched from an arbitrary URL. SHA-1 signatures and XML
entity declarations remain rejected. An IdP application tile should send the user into a fresh
SP-initiated login; unsolicited assertions are not accepted.

Vendor tenant checks require actual test credentials. Okta and Entra are not certified or claimed
verified by synthetic fixtures. The local Keycloak check ran against the built server and disposable PostgreSQL on 2026-10-18.
It imported the candidate SP certificate before testing and activated it after a successful signed
round trip. Retiring the old certificate preserved the already admitted member session. Keycloak
uses a single configured client signing certificate in this setup; do not promise zero downtime
for an IdP that cannot accept overlapping SP pins. Coordinate its import/activation window.
The test used console email and generated local TLS material; it sent no live email.
Browser automation did not accept the disposable self-signed TLS certificate; the real protocol
journeys above used a client that explicitly trusted that test CA. Browser cookie behavior is
verified separately on loopback HTTP and by HTTP boundary tests.
