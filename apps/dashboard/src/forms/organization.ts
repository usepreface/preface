import { CreateOrganizationInput, UpdateOrganizationInput } from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

const messages = {
  required: { "metadata.name": "Give the organization a name.", slug: "Choose a URL." },
  format: { slug: "Use lowercase letters, numbers and single dashes." },
};

/** /setup/organization and /organizations/new. */
export const createOrganizationForm = toFormSchema(CreateOrganizationInput, messages);

/** /org/:slug/settings/general. */
export const updateOrganizationForm = toFormSchema(UpdateOrganizationInput, messages);
