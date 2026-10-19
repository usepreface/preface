/* oxlint-disable no-await-in-loop -- Preserve successful partial changes and stop after the first rejected mutation. */
import type { PublicOrganizationRole, PublicTeam } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";
import { useFieldArray } from "react-hook-form";

import { QueryState } from "#/components/api/query-state";
import { FormDialog } from "#/components/feedback/form-dialog";
import { ChoiceField } from "#/components/form/choice-field";
import { EmailListField } from "#/components/form/email-list-field";
import { SelectField } from "#/components/form/select-field";
import { SubmitButton } from "#/components/form/submit-button";
import { inviteMembersForm } from "#/forms/invitation";
import { useAllRoles, useAllTeams, useOrganizationInvitationsCreate } from "#/hooks/membership";
import { useOrganization } from "#/hooks/organizations";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

export function InviteMembersDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return open ? <InviteChoices onClose={() => onOpenChange(false)} /> : null;
}
function InviteChoices({ onClose }: { onClose: () => void }) {
  const { access } = useOrganization();
  const roles = useAllRoles();
  return (
    <QueryState query={roles}>
      {roles.data ? (
        access.permissions.includes("teams.read") ? (
          <InviteTeamChoices roles={roles.data} onClose={onClose} />
        ) : (
          <InviteForm roles={roles.data} teams={[]} onClose={onClose} />
        )
      ) : null}
    </QueryState>
  );
}
function InviteTeamChoices({
  roles,
  onClose,
}: {
  roles: readonly PublicOrganizationRole[];
  onClose: () => void;
}) {
  const teams = useAllTeams();
  return (
    <QueryState query={teams}>
      {teams.data ? <InviteForm roles={roles} teams={teams.data} onClose={onClose} /> : null}
    </QueryState>
  );
}
function InviteForm({
  roles,
  teams: choices,
  onClose,
}: {
  roles: readonly PublicOrganizationRole[];
  teams: readonly PublicTeam[];
  onClose: () => void;
}) {
  const { access } = useOrganization();
  const create = useOrganizationInvitationsCreate();
  const assignable = roles.filter(
    (role) =>
      role.key !== "owner" &&
      role.permissions.every(
        (permission) => access.isOwner || new Set<string>(access.permissions).has(permission),
      ),
  );
  const form = useSchemaForm(inviteMembersForm, {
    defaultValues: {
      emails: [],
      roleIds: assignable
        .filter(
          (role) =>
            role.scopeKind === "organization" && role.key === "member" && role.kind === "builtin",
        )
        .map((role) => role.id),
      teams: [],
    },
  });
  const teams = useFieldArray({ control: form.control, name: "teams" });

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open && !create.pending) onClose();
      }}
      title="Invite members"
      description="Invitations expire in seven days. Roles and team assignments are checked again when accepted."
      footer={
        <>
          <Button type="button" variant="ghost" disabled={create.pending} onClick={onClose}>
            Cancel
          </Button>
          <SubmitButton pending={create.pending || form.formState.isSubmitting}>
            Send invitations
          </SubmitButton>
        </>
      }
      as={(content) => (
        <form
          noValidate
          className="contents"
          onSubmit={form.handleSubmit(async ({ emails, ...assignment }) => {
            const remaining = [...emails];
            for (const email of emails) {
              const response = await create.run({
                payload: { ...assignment, email },
              });
              if (!response) {
                form.setValue("emails", remaining);
                return;
              }
              remaining.shift();
            }
            feedback.done(
              "Invitations queued",
              `${emails.length} invitation${emails.length === 1 ? "" : "s"} will be delivered by email.`,
            );
            onClose();
          })}
        >
          {content}
        </form>
      )}
    >
      <EmailListField control={form.control} name="emails" label="Email addresses" />
      <ChoiceField
        control={form.control}
        name="roleIds"
        label="Organization roles"
        multiple
        columns={2}
        options={assignable
          .filter((role) => role.scopeKind === "organization")
          .map((role) => ({ value: role.id, label: role.name }))}
      />
      {teams.fields.map((team, index) => (
        <div key={team.id} className="flex flex-col gap-2 rounded-lg border p-3">
          <SelectField
            control={form.control}
            name={`teams.${index}.teamId`}
            label="Team"
            options={choices.map((choice) => ({ value: choice.id, label: choice.metadata.name }))}
          />
          <ChoiceField
            control={form.control}
            name={`teams.${index}.roleIds`}
            label="Team roles"
            multiple
            columns={2}
            options={roles
              .filter((role) => role.scopeKind === "team")
              .map((role) => ({ value: role.id, label: role.name }))}
          />
          <Button type="button" variant="ghost" onClick={() => teams.remove(index)}>
            Remove team
          </Button>
        </div>
      ))}
      {choices.length ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const firstTeam = choices[0];
            const memberRole = roles.find(
              (role) =>
                role.scopeKind === "team" && role.kind === "builtin" && role.key === "member",
            );
            if (firstTeam)
              teams.append({
                teamId: firstTeam.id,
                ...(memberRole ? { roleIds: [memberRole.id] } : {}),
              });
          }}
        >
          Assign a team
        </Button>
      ) : null}
    </FormDialog>
  );
}
