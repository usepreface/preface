import { Button } from "@usepreface/ui/components/button";
import { Label } from "@usepreface/ui/components/label";
import { CloseIcon, MailIcon, PlusIcon, ShieldIcon } from "@usepreface/ui/icons";
import { useFieldArray } from "react-hook-form";

import { FormDialog } from "#/components/feedback/form-dialog";
import { ChoiceField } from "#/components/form/choice-field";
import { EmailListField } from "#/components/form/email-list-field";
import { SelectField } from "#/components/form/select-field";
import { SubmitButton } from "#/components/form/submit-button";
import { inviteMembersForm } from "#/forms/invitation";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { teamOptions } from "#/lib/placeholder";
import { organizationRoles, roleIds, teamRoles } from "#/lib/roles";

const roleChoices = organizationRoles
  .filter((role) => role.key !== "owner")
  .map((role) => ({ value: role.id, label: role.name, description: role.description }));
const teamChoices = teamOptions.map((team) => ({ value: team.id, label: team.name }));
const teamRoleChoices = teamRoles.map((role) => ({ value: role.id, label: role.name }));

/*
 * Invite one or more people with the same organization roles and, optionally, teams. Owner is
 * not offered: ownership is transferred, not invited.
 */
export function InviteMembersDialog({
  open,
  onOpenChange,
  preview,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Prefills the form the way the design shows it. */
  preview?: boolean;
}) {
  const form = useSchemaForm(inviteMembersForm, {
    defaultValues: preview
      ? {
          emails: ["tomas@acme.dev", "nina@acme.dev"],
          roleIds: roleIds(["Member"]),
          teams: [
            { teamId: teamOptions[1].id, roleIds: roleIds(["Team member"]) },
            { teamId: teamOptions[2].id, roleIds: roleIds(["Team lead"]) },
          ],
        }
      : { emails: [], roleIds: roleIds(["Member"]), teams: [] },
  });
  const teams = useFieldArray({ control: form.control, name: "teams" });
  const count = form.watch("emails").length;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Invite members"
      description="They’ll get an email invitation that expires in 7 days."
      note={
        <span className="flex items-center gap-1.5">
          <ShieldIcon className="size-3.5 shrink-0" />
          Signup is invitation-only. Invites go only to these addresses.
        </span>
      }
      as={(content) => (
        <form
          noValidate
          className="contents"
          onSubmit={form.handleSubmit(({ emails }) => {
            feedback.sent(
              emails.length === 1 ? "Invitation sent" : `${emails.length} invitations sent`,
              emails.join(", "),
            );
            onOpenChange(false);
            form.reset();
          })}
        >
          {content}
        </form>
      )}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <SubmitButton>
            <MailIcon data-icon="inline-start" />
            {count > 1 ? `Send ${count} invitations` : "Send invitation"}
          </SubmitButton>
        </>
      }
    >
      <EmailListField
        control={form.control}
        name="emails"
        label="Email addresses"
        description="Separate with commas or press Enter. People with acme.dev addresses can join through Okta."
      />
      <ChoiceField
        control={form.control}
        name="roleIds"
        label="Organization roles"
        options={roleChoices.slice(0, 3)}
        multiple
      />
      <div className="flex flex-col gap-2">
        <Label>
          Teams <span className="font-normal text-fg-tertiary">Optional</span>
        </Label>
        {teams.fields.map((team, index) => (
          <div key={team.id} className="flex items-start gap-2">
            <SelectField
              control={form.control}
              name={`teams.${index}.teamId`}
              label={<span className="sr-only">Team</span>}
              options={teamChoices}
              className="min-w-0 flex-1 gap-0"
            />
            <SelectField
              control={form.control}
              name={`teams.${index}.roleIds.0`}
              label={<span className="sr-only">Team role</span>}
              options={teamRoleChoices}
              className="w-44 gap-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove team"
              onClick={() => teams.remove(index)}
            >
              <CloseIcon />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-fg-accent"
          disabled={teams.fields.length >= teamChoices.length}
          onClick={() =>
            teams.append({
              teamId:
                teamChoices.find(
                  (team) => !form.getValues("teams")?.some((t) => t.teamId === team.value),
                )?.value ?? teamOptions[0].id,
              roleIds: roleIds(["Team member"]),
            })
          }
        >
          <PlusIcon data-icon="inline-start" />
          {teams.fields.length ? "Add to another team" : "Add to a team"}
        </Button>
      </div>
    </FormDialog>
  );
}
