import { Schema } from "effect";

import { OrganizationRoleId } from "#/identifiers/organization";

export const InvitationRoleIds = Schema.Array(OrganizationRoleId).check(
  Schema.isMinLength(1),
  Schema.isMaxLength(20),
  Schema.isUnique(),
);
