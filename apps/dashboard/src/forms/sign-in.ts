import { Schema } from "effect";

import { CreateOrganizationInput, RequestEmailSignInInput } from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

const emailMessages = {
  required: { email: "Enter your work email." },
  format: { email: "Enter a full email, like name@company.com." },
};

/** /sign-in: email discovery. */
export const signInEmailForm = toFormSchema(RequestEmailSignInInput, emailMessages);

/** /sign-in when the email domain doesn't identify an organization's SSO. */
export const organizationUrlForm = toFormSchema(
  Schema.Struct({ organizationSlug: CreateOrganizationInput.fields.slug }),
  {
    required: { organizationSlug: "Enter your organization’s URL." },
    format: { organizationSlug: "Use the part after /org/, like acme." },
  },
);
