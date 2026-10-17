import { Record, Schema } from "effect";

const statuses = {
  INVALID_INPUT: 400,
  FORBIDDEN: 403,
  AUTHENTICATION_REQUIRED: 403,
  ORGANIZATION_NOT_FOUND: 404,
  MEMBER_NOT_FOUND: 404,
  ROLE_NOT_FOUND: 404,
  BINDING_NOT_FOUND: 404,
  SLUG_UNAVAILABLE: 409,
  ROLE_KEY_UNAVAILABLE: 409,
  ORGANIZATION_ARCHIVED: 409,
  MEMBER_NOT_ACTIVE: 409,
  LAST_OWNER: 409,
  LAST_AUTHENTICATION_PATH: 409,
  BUILTIN_ROLE_PROTECTED: 409,
  ROLE_NOT_ASSIGNABLE: 403,
} as const;
export class OrganizationError extends Schema.TaggedError<OrganizationError>()(
  "OrganizationError",
  {
    code: Schema.Literals(Record.keys(statuses)),
  },
) {
  static readonly statuses = statuses;
}
