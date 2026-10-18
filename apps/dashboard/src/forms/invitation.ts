import { Schema, Struct } from "effect";

import { CreateInvitationInput, InvitationAuthenticationInput } from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

/**
 * Members → Invite. The API takes one email per invitation; the form collects several and sends
 * one request each, with the same roles and teams.
 */
export const inviteMembersForm = toFormSchema(
  CreateInvitationInput.mapFields(({ email, ...rest }) => ({
    emails: Schema.Array(email).check(
      Schema.isMinLength(1),
      Schema.isMaxLength(20),
      Schema.isUnique(),
    ),
    ...rest,
  })),
  {
    required: { emails: "Add at least one email.", roleIds: "Choose at least one role." },
    format: { emails: "Check the email addresses." },
  },
);

/** /invitations/accept: what a new member is called. */
export const acceptInvitationForm = toFormSchema(
  InvitationAuthenticationInput.mapFields(Struct.pick(["displayName"])),
  { required: { displayName: "Tell your teammates what to call you." } },
);

/** The one-field invite on the organization home: an email, sent with the Member role. */
export const quickInviteForm = toFormSchema(
  CreateInvitationInput.mapFields(Struct.pick(["email"])),
  {
    required: { email: "Enter an email to invite." },
    format: { email: "Enter a full email, like name@acme.dev." },
  },
);

/** Members → Manage roles: the organization roles one member holds. */
export const memberRolesForm = toFormSchema(
  CreateInvitationInput.mapFields(Struct.pick(["roleIds"])),
  {
    required: { roleIds: "Keep at least one role." },
  },
);
