import { Struct } from "effect";

import {
  RecoverOrganizationAuthInput,
  UpdateOrganizationAuthPolicyInput,
} from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

/** /settings/authentication. The revision comes from the loaded policy, not the form. */
export const loginPolicyForm = toFormSchema(
  UpdateOrganizationAuthPolicyInput.mapFields(
    Struct.omit(["expectedRevision", "recoveryCredential"]),
  ),
);

/** /auth-recovery. */
export const recoveryForm = toFormSchema(
  RecoverOrganizationAuthInput.mapFields(Struct.pick(["recoveryCredential"])),
  { required: { recoveryCredential: "Paste the recovery credential." } },
);

/** Re-authentication choices offered in the login policy form, in seconds. */
export const reauthenticationIntervals = [
  { value: 3600, label: "Every hour" },
  { value: 43200, label: "Every 12 hours" },
  { value: 86400, label: "Every day" },
  { value: 604800, label: "Every week" },
] as const;

export const updateLoginPolicyForm = toFormSchema(
  UpdateOrganizationAuthPolicyInput.mapFields(Struct.omit(["expectedRevision"])),
);
