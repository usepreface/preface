import { cn } from "@usepreface/ui/lib/utils";
import type { FieldPath, FieldValues } from "react-hook-form";

import { FormField, type FormFieldProps } from "./form-field";

export type Choice<V extends string> = {
  readonly value: V;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
};

const cardClass = cn(
  "flex cursor-pointer items-start gap-2.5 rounded-lg border bg-surface-1 px-3 py-2.5 text-left transition-colors",
  "hover:bg-hover has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-focus-ring",
  "has-[:checked]:border-border-focus has-[:checked]:bg-primary-subtle",
  "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
);

/*
 * A few options as cards with a title and a line of description. `multiple` binds a string
 * array (roles to grant); otherwise the field holds one value (a protocol, a scope).
 */
export function ChoiceField<T extends FieldValues, N extends FieldPath<T>, O, V extends string>({
  options,
  multiple,
  columns = options.length,
  ...field
}: Omit<FormFieldProps<T, N, O>, "children"> & {
  options: readonly Choice<V>[];
  multiple?: boolean;
  columns?: number;
}) {
  return (
    <FormField {...field}>
      {({ field: control, id, invalid, describedBy }) => {
        const selected: readonly string[] = multiple ? (control.value ?? []) : [control.value];
        return (
          <div
            id={id}
            role={multiple ? "group" : "radiogroup"}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className="grid gap-2 max-sm:grid-cols-1!"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {options.map((option) => (
              <label key={option.value} className={cardClass}>
                <input
                  type={multiple ? "checkbox" : "radio"}
                  name={control.name}
                  value={option.value}
                  disabled={control.disabled || option.disabled}
                  checked={selected.includes(option.value)}
                  onBlur={control.onBlur}
                  onChange={(event) => {
                    if (!multiple) return control.onChange(option.value);
                    control.onChange(
                      event.target.checked
                        ? [...selected, option.value]
                        : selected.filter((value) => value !== option.value),
                    );
                  }}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                  {option.description ? (
                    <span className="text-caption text-fg-tertiary">{option.description}</span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        );
      }}
    </FormField>
  );
}
