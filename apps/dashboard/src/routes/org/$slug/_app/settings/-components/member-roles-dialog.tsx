import { Button } from "@usepreface/ui/components/button";

import { FormDialog } from "#/components/feedback/form-dialog";
import { ChoiceField } from "#/components/form/choice-field";
import { SubmitButton } from "#/components/form/submit-button";
import { memberRolesForm } from "#/forms/invitation";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import type { Member } from "#/lib/placeholder";
import { organizationRoles, roleIds } from "#/lib/roles";

/** The organization roles one member holds. Only owners can grant Owner. */
export function MemberRolesDialog({
  member,
  onOpenChange,
}: {
  member: Member;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useSchemaForm(memberRolesForm, {
    defaultValues: { roleIds: roleIds(member.roles) },
  });
  const choices = organizationRoles.map((role) => ({
    value: role.id,
    label: role.kind === "custom" ? `${role.name} · custom` : role.name,
    description: role.description,
    disabled: role.key === "owner",
  }));

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      title={`Roles for ${member.name}`}
      description="Roles decide what someone can do across the organization."
      note="Only owners can grant Owner."
      as={(content) => (
        <form
          noValidate
          className="contents"
          onSubmit={form.handleSubmit(() => {
            feedback.saved(`Roles for ${member.name}`);
            onOpenChange(false);
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
          <SubmitButton disabled={!form.formState.isDirty}>Save</SubmitButton>
        </>
      }
    >
      <ChoiceField
        control={form.control}
        name="roleIds"
        label="Organization roles"
        options={choices}
        multiple
        columns={1}
      />
    </FormDialog>
  );
}
