import { Schema } from "effect";

import { EmailAddressInput } from "#/common/email";
import { OrganizationSlug } from "#/common/organization";

export const AuthenticationDiscoveryInput = Schema.Struct({
  email: EmailAddressInput,
  organizationSlug: Schema.optionalKey(OrganizationSlug),
});
export type AuthenticationDiscoveryInput = typeof AuthenticationDiscoveryInput.Type;
