import { Checkbox } from "@usepreface/ui/components/checkbox";
import type { FieldPath, FieldValues } from "react-hook-form";

import { FormField, type FormFieldProps } from "#/components/form/form-field";
import type { PermissionGroup } from "#/lib/permissions";

/*
 * Permissions in labelled groups. A group's checkbox turns the whole group on or off and shows
 * a mixed state when only some are granted. The field value is the array of permission ids.
 */
export function PermissionsField<T extends FieldValues, N extends FieldPath<T>, O>({
  groups,
  disabled,
  ...field
}: Omit<FormFieldProps<T, N, O>, "children"> & {
  groups: readonly PermissionGroup<string>[];
  disabled?: boolean;
}) {
  return (
    <FormField {...field}>
      {({ field: control, id, invalid, describedBy }) => {
        const granted: readonly string[] = control.value ?? [];
        const set = (ids: readonly string[], on: boolean) =>
          control.onChange(
            on
              ? [...new Set([...granted, ...ids])]
              : granted.filter((permission) => !ids.includes(permission)),
          );
        return (
          <div
            id={id}
            role="group"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className="flex flex-col gap-2"
          >
            {groups.map((group) => {
              const ids = group.permissions.map((permission) => permission.id);
              const on = ids.filter((permission) => granted.includes(permission)).length;
              return (
                <fieldset
                  key={group.title}
                  className="flex flex-col gap-2 rounded-lg border px-3 py-2.5"
                >
                  <legend className="sr-only">{group.title}</legend>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={on === ids.length}
                      indeterminate={on > 0 && on < ids.length}
                      disabled={disabled}
                      onCheckedChange={(checked) => set(ids, checked === true)}
                      aria-label={`All ${group.title.toLowerCase()} permissions`}
                    />
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {group.title}
                    </span>
                    <span className="text-caption text-fg-tertiary">
                      {on} of {ids.length}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 pl-6">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <Checkbox
                          checked={granted.includes(permission.id)}
                          disabled={disabled}
                          onCheckedChange={(checked) => set([permission.id], checked === true)}
                          onBlur={control.onBlur}
                        />
                        {permission.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
        );
      }}
    </FormField>
  );
}
