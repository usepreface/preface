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

The maintained [Playwright suite](../../tests/e2e/auth) runs Keycloak journeys against the built
server and disposable PostgreSQL with Mailpit capturing real STARTTLS delivery. It checks the
browser redirect/cookie handoff, direct invited admission, email-first linking and staged SP
rollover. The SAML test imports the candidate SP certificate before its signed round trip, then
activates it and retires the old certificate while preserving the admitted member session.
Keycloak uses one configured client signing certificate in this fixture; an IdP without overlapping
SP pins still requires a coordinated import/activation window.

Vendor tenant checks require actual test credentials. Okta and Entra are not certified or claimed
verified by synthetic fixtures. Google SDK/security cases remain in the fast application suite;
this local browser lane does not contact Google. See [test infrastructure and limits](../engineering/development.md#disposable-authentication-journeys).
