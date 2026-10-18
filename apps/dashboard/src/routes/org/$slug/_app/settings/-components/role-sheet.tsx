import * as React from "react";

import { Badge } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";

import { FormSheet } from "#/components/feedback/form-dialog";
import { ChoiceField } from "#/components/form/choice-field";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { roleForm } from "#/forms/roles";
import { feedback } from "#/lib/feedback";
import { useDerivedSlug } from "#/lib/forms/use-derived-slug";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { permissionCount, permissionGroupsFor } from "#/lib/permissions";
import { roles, type Role } from "#/lib/placeholder";

import { PermissionsField } from "./permissions-field";

const scopes = [
  { value: "organization", label: "Organization", description: "Across the organization" },
  { value: "team", label: "Team", description: "Inside one team" },
] as const;

const keys: ReadonlySet<string> = new Set(roles.map((role) => role.key));

/*
 * Create a custom role, edit one, or read a built-in role. Built-in roles open read-only:
 * their permissions are part of Preface.
 */
export function RoleSheet({
  role,
  open,
  onOpenChange,
}: {
  role?: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const builtin = role?.kind === "builtin";
  const form = useSchemaForm(roleForm, {
    defaultValues: role
      ? {
          scopeKind: role.scope,
          name: role.name,
          key: role.key,
          permissions: [...role.permissions],
        }
      : { scopeKind: "organization", name: "", key: "", permissions: [] },
    disabled: builtin,
  });
  useDerivedSlug(form, "name", "key");
  const scope = form.watch("scopeKind") ?? "organization";
  const key = form.watch("key");
  const total = permissionCount(scope);
  const count = form.watch("permissions").length;
  const keyTaken = !role && keys.has(key);
  const { resetField } = form;

  React.useEffect(() => {
    if (!role) resetField("permissions", { defaultValue: [] });
  }, [scope, role, resetField]);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={role ? role.name : "Create role"}
      description={
        builtin
          ? "Built-in roles can’t be changed. Create a custom role to grant something different."
          : role
            ? "Changes apply to everyone with this role right away."
            : "Custom roles can be edited or archived any time."
      }
      as={(content) => (
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={form.handleSubmit(({ name }) => {
            feedback.saved(`Role ${name}`);
            onOpenChange(false);
          })}
        >
          {content}
        </form>
      )}
      footer={
        builtin ? (
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        ) : (
          <>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton disabled={keyTaken}>{role ? "Save role" : "Create role"}</SubmitButton>
          </>
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="name" label="Name" />
        <TextField
          control={form.control}
          name="key"
          label="Key"
          inputProps={{ className: "font-mono", disabled: Boolean(role) }}
          description={
            role
              ? "Keys can’t change."
              : keyTaken
                ? `${key} is already a role key.`
                : "Used in the API. Unique in the organization."
          }
        />
      </div>
      <ChoiceField control={form.control} name="scopeKind" label="Scope" options={scopes} />
      <PermissionsField
        control={form.control}
        name="permissions"
        label={`Permissions · ${count} of ${total}`}
        labelExtra={builtin ? <Badge variant="outline">Read-only</Badge> : null}
        groups={permissionGroupsFor(scope)}
        disabled={builtin}
      />
    </FormSheet>
  );
}
