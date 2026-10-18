import { Struct } from "effect";

import { CompleteBootstrapInput } from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

/** The 8-digit email code used by setup, sign-in, external sign-in and re-authentication. */
export const verificationCodeForm = toFormSchema(
  CompleteBootstrapInput.mapFields(Struct.pick(["code"])),
  {
    required: { code: "Enter the 8-digit code from the email." },
    format: { code: "Enter all 8 digits." },
  },
);
export const emptyCode = { code: "" };
