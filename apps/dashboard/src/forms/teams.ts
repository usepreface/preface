import { Schema } from "effect";

import { OrganizationRoleId } from "@usepreface/protocol";
import { CreateTeamInput, UpdateTeamInput } from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

const messages = {
  required: { "metadata.name": "Give the team a name.", slug: "Choose a slug." },
  format: { slug: "Use lowercase letters, numbers and single dashes." },
};

export const createTeamForm = toFormSchema(CreateTeamInput, messages);
export const updateTeamForm = toFormSchema(UpdateTeamInput, messages);

/** Team → Add members: existing organization members and the team role they get. */
export const addTeamMembersForm = toFormSchema(
  Schema.Struct({
    members: Schema.Array(Schema.String).check(Schema.isMinLength(1)),
    roleId: OrganizationRoleId,
  }),
  { required: { members: "Choose at least one person.", roleId: "Choose a team role." } },
);
