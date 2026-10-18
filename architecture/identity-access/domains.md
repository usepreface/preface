# Organization domain authority

Organizations can establish exact email-domain authority through DNS TXT verification or
explicit instance-owner approval. This is identity proof, not membership, global domain
capture, or permission to create organizations. Multiple organizations may verify a domain.

`organization.domain` stores the canonical domain, revision, verification source, one-year
verification deadline and optional operator attribution. `auth.identity_connection_domain`
binds that claim's revision to an exact active organization connection revision. Composite
foreign keys prevent cross-organization approval. Expired/revoked claims and stale bindings
are excluded from authority queries. Changing claims requires an explicit fresh binding.

Organization owners use `/api/v1/organizations/:organizationId/domains` to create/list claims,
request/confirm verification or revoke them. Mutation requires recent local email. The
request returns a random TXT value for `_preface-verification.<domain>` with a 30-minute
deadline; only its purpose-separated digest is stored. Replacement invalidates the old proof.
The Node resolver bounds requests, records and response sizes, supports cancellation, and
performs DNS work outside the business transaction. Final verification rechecks current
authority, challenge revision and expiry under the organization lock before committing audit.

An instance owner can manually approve a claim through
`/api/v1/instance/organizations/:organizationId/domains/:domainId/approve` after independently
establishing control, including private/internal deployments. This requires fresh local email;
ordinary organization administration cannot self-attest through this route. The matching instance
GET permits reviewing the exact claim before approval, and POST `/revoke` withdraws only a manual
operator approval. Both require fresh instance-owner authentication and reveal no organization
content. Organization owners can revoke their own claims through the ordinary route. It grants no
organization content access to the operator.

Connection owners explicitly replace a connection's approved domains through its `/domains`
endpoint. Lock ordering is connection then organization. The connection must be active and
its expected revision must match. At most 20 verified domains can be bound; an organization
has at most 50 domain records. Domain and connection changes are audited transactionally.
Existing account links are not transferred or erased when domain authority is revoked.

Domain syntax is shared protocol validation. The application uses `tldts`'s public/private
suffix data to reject suffix-only claims and IPs; common consumer-mail domains are excluded.
ASCII domains, including punycode IDNs, are accepted. Unicode names must be supplied in their
ASCII form. Verification matches only the exact domain, without implicit subdomain authority.
There is no automatic DNS refresh or membership admission from verified domains.

Workflow regressions compose real migrated repositories and substitute only DNS resolution.
They cover replaced proofs, exact connection binding, revocation, manual approval authority
and cross-organization rejection. Protocol trust consumers are documented with their owning
authentication flow when wired.

## Source

- [Storage](../../packages/database/src/schema/organization/domain.ts)
- [Repository](../../packages/database/src/repositories/organization/domain.ts)
- [Workflows](../../packages/application/src/organization/domain/application.ts)
- [Node DNS](../../packages/application/src/node/domain-dns.ts)
- [HTTP contracts](../../packages/api/src/groups/organization-domains.ts)
- [HTTP handlers](../../apps/server/src/http/routes/organization/domains.ts)
- [Tests](../../packages/application/tests/integration/organization/domains.test.ts)
