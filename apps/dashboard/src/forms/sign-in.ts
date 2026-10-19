import { RequestEmailSignInInput } from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";
export const signInEmailForm = toFormSchema(RequestEmailSignInInput, {
  required: { email: "Enter your work email." },
  format: { email: "Enter a full email, like name@company.com." },
});
