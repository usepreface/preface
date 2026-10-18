import { Schema } from "effect";

import { DomainName } from "#/common/domain";
import { IdentityRevision } from "#/common/identity";
import { OrganizationDomainId } from "#/identifiers/identity";

export const PublicOrganizationDomain = Schema.Struct({
  id: OrganizationDomainId,
  domain: DomainName,
  revision: IdentityRevision,
  verificationMethod: Schema.NullOr(Schema.Literals(["dns", "operator"])),
  verifiedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  verifiedUntil: Schema.NullOr(Schema.DateTimeUtcFromString),
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
});
export const OrganizationDomainList = Schema.Struct({
  domains: Schema.Array(PublicOrganizationDomain),
});
export const CreateDomainRequest = Schema.Struct({ domain: Schema.String });
export const DomainRevisionRequest = Schema.Struct({ expectedRevision: IdentityRevision });
export const DomainChallenge = Schema.Struct({
  domain: PublicOrganizationDomain,
  recordName: Schema.String,
  recordValue: Schema.String,
  expiresAt: Schema.DateTimeUtcFromString,
});
export const ConnectionDomainsRequest = Schema.Struct({
  expectedRevision: IdentityRevision,
  domainIds: Schema.Array(OrganizationDomainId).check(Schema.isMaxLength(20)),
});
export const ConnectionDomains = Schema.Struct({ domains: Schema.Array(PublicOrganizationDomain) });
