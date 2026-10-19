import { UpdateOrganizationInput } from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";
export const updateOrganizationForm = toFormSchema(UpdateOrganizationInput, {
  required: { "metadata.name": "Give the organization a name." },
});
