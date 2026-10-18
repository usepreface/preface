import { CreateOrganizationRoleInput } from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

export const roleForm = toFormSchema(CreateOrganizationRoleInput, {
  required: {
    name: "Name the role.",
    key: "Choose a key.",
    permissions: "Choose at least one permission.",
  },
  format: { key: "Start with a letter. Use lowercase letters, numbers and dashes." },
});
