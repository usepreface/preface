import { Struct } from "effect";

import { SaveGoogleConnectionInput } from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

/** /instance/authentication. The revision comes from the loaded connection, not the form. */
export const googleConnectionForm = toFormSchema(
  SaveGoogleConnectionInput.mapFields(Struct.omit(["expectedRevision"])),
  { required: { clientId: "Paste the client ID." } },
);

export const initialGoogleConnectionForm = toFormSchema(
  SaveGoogleConnectionInput.mapFields(Struct.omit(["expectedRevision"])).mapFields(
    ({ clientSecret, ...fields }) => ({ ...fields, clientSecret: clientSecret.schema }),
  ),
  { required: { clientId: "Paste the client ID.", clientSecret: "Paste the client secret." } },
);
