/* oxlint-disable no-await-in-loop -- Preserve successful partial changes and stop after the first rejected mutation. */
import type { OrganizationMemberId, TeamId } from "@usepreface/protocol";
import type {
  PublicOrganizationRole,
  PublicOrganizationRoleBinding,
} from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import { QueryState } from "#/components/api/query-state";
import { FormDialog } from "#/components/feedback/form-dialog";
import { ChoiceField } from "#/components/form/choice-field";
import { SubmitButton } from "#/components/form/submit-button";
import { memberRolesForm } from "#/forms/invitation";
import {
  useBindings,
  useOrganizationRoleBindingsGrant,
  useOrganizationRoleBindingsRevoke,
} from "#/hooks/membership";
import { useOrganization } from "#/hooks/organizations";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

export function MemberRolesDialog({
  memberId,
  name,
  roles,
  teamId,
  onClose,
}: {
  memberId: OrganizationMemberId;
  name: string;
  roles: readonly PublicOrganizationRole[];
  teamId?: TeamId;
  onClose: () => void;
}) {
  const { organization } = useOrganization();
  const bindings = useBindings(organization.id, memberId, teamId);
  return (
    <QueryState query={bindings}>
      {bindings.data ? (
        <EditRoles
          key={memberId}
          memberId={memberId}
          name={name}
          roles={roles}
          teamId={teamId}
          onClose={onClose}
          bindings={bindings.data.bindings}
        />
      ) : null}
    </QueryState>
  );
}
function EditRoles({
  memberId,
  name,
  roles,
  teamId,
  onClose,
  bindings,
}: {
  memberId: OrganizationMemberId;
  name: string;
  roles: readonly PublicOrganizationRole[];
  teamId?: TeamId;
  onClose: () => void;
  bindings: readonly PublicOrganizationRoleBinding[];
}) {
  const { organization } = useOrganization();
  const grant = useOrganizationRoleBindingsGrant();
  const revoke = useOrganizationRoleBindingsRevoke();
  const form = useSchemaForm(memberRolesForm, {
    defaultValues: { roleIds: bindings.map((binding) => binding.roleId) },
  });
  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open && !form.formState.isSubmitting) onClose();
      }}
      title={`Roles for ${name}`}
      footer={<SubmitButton pending={form.formState.isSubmitting}>Save roles</SubmitButton>}
      as={(content) => (
        <form
          className="contents"
          onSubmit={form.handleSubmit(async ({ roleIds }) => {
            for (const roleId of roleIds.filter(
              (candidateId) => !bindings.some((existing) => existing.roleId === candidateId),
            )) {
              if (
                !(await grant.run({
                  params: { organizationId: organization.id },
                  payload: { memberId, roleId, teamId },
                }))
              )
                return;
            }
            for (const binding of bindings.filter(
              (existing) => !roleIds.includes(existing.roleId),
            )) {
              if (
                !(await revoke.run({
                  params: { organizationId: organization.id, bindingId: binding.id },
                }))
              )
                return;
            }
            feedback.saved("Roles");
            onClose();
          })}
        >
          {content}
        </form>
      )}
    >
      <ChoiceField
        control={form.control}
        name="roleIds"
        label="Roles"
        multiple
        columns={2}
        options={roles.map((role) => ({
          value: role.id,
          label: role.name,
          disabled: role.key === "owner" && role.kind === "builtin",
        }))}
      />
      <Button type="button" variant="ghost" onClick={onClose}>
        Cancel
      </Button>
    </FormDialog>
  );
}
