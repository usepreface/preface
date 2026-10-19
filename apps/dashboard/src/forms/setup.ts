import { Struct } from "effect";

import { RequestBootstrapVerificationInput } from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

/** /setup: the instance and its owner. The bootstrap token comes from the setup link, not the form. */
export const instanceSetupForm = toFormSchema(
  RequestBootstrapVerificationInput.mapFields(Struct.omit(["token"])),
  {
    required: {
      organizationName: "Give the instance a name.",
      ownerName: "Enter the owner’s name.",
      email: "Enter the owner’s email.",
    },
    format: { email: "Enter a full email, like name@acme.dev." },
  },
);
