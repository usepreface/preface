import { useEffect } from "react";

import type { PublicOrganizationRole } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import { FormSheet } from "#/components/feedback/form-dialog";
import { ChoiceField } from "#/components/form/choice-field";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { roleForm } from "#/forms/roles";
import { useOrganizationRolesCreate, useOrganizationRolesUpdate } from "#/hooks/membership";
import { useOrganization } from "#/hooks/organizations";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { permissionGroupsFor } from "#/lib/permissions";

import { PermissionsField } from "./permissions-field";

export function RoleSheet({
  role,
  onClose,
}: {
  role?: PublicOrganizationRole;
  onClose: () => void;
}) {
  const { access } = useOrganization();
  const readonly =
    role?.kind === "builtin" ||
    Boolean(role?.archivedAt) ||
    !access.permissions.includes("roles.manage") ||
    (role?.scopeKind === "team" && !access.permissions.includes("teams.manage")) ||
    (role?.scopeKind === "organization" &&
      !role.permissions.every((permission) => new Set<string>(access.permissions).has(permission)));
  const create = useOrganizationRolesCreate();
  const update = useOrganizationRolesUpdate();
  const form = useSchemaForm(roleForm, {
    defaultValues: role
      ? {
          scopeKind: role.scopeKind,
          name: role.name,
          key: role.key,
          permissions: [...role.permissions],
        }
      : { scopeKind: "organization", name: "", key: "", permissions: [] },
    disabled: readonly,
  });
  const scope = form.watch("scopeKind") ?? "organization";
  const previousScope = role?.scopeKind;
  const { resetField } = form;
  useEffect(() => {
    if (!previousScope) resetField("permissions", { defaultValue: [] });
  }, [scope, previousScope, resetField]);
  return (
    <FormSheet
      open
      onOpenChange={(open) => {
        if (!open && !form.formState.isSubmitting) onClose();
      }}
      title={role?.name ?? "Create role"}
      description={
        readonly ? "This role is read-only." : "Changes apply to current assignments immediately."
      }
      footer={
        readonly ? (
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        ) : (
          <SubmitButton pending={form.formState.isSubmitting}>Save role</SubmitButton>
        )
      }
      as={(content) => (
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={form.handleSubmit(async (payload) => {
            const response = role
              ? await update.run({
                  params: { roleId: role.id },
                  payload: { name: payload.name, permissions: payload.permissions },
                })
              : await create.run({ payload });
            if (response) {
              feedback.saved("Role");
              onClose();
            }
          })}
        >
          {content}
        </form>
      )}
    >
      <TextField control={form.control} name="name" label="Name" />
      <TextField
        control={form.control}
        name="key"
        label="Key"
        inputProps={{ disabled: Boolean(role) || readonly }}
      />
      {!role ? (
        <ChoiceField
          control={form.control}
          name="scopeKind"
          label="Scope"
          options={[
            { value: "organization", label: "Organization" },
            {
              value: "team",
              label: "Team",
              disabled: !access.permissions.includes("teams.manage"),
            },
          ]}
        />
      ) : null}
      <PermissionsField
        control={form.control}
        name="permissions"
        label="Permissions"
        groups={permissionGroupsFor(scope)}
        disabled={readonly}
      />
    </FormSheet>
  );
}
