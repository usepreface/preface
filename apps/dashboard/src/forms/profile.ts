import { UpdateProfileInput } from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

/** /account/profile. Email is shown read-only and is not part of the form. */
export const profileForm = toFormSchema(UpdateProfileInput, {
  required: { "metadata.name": "Enter the name people should see." },
});
