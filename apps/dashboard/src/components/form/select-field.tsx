import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@usepreface/ui/components/select";
import type { FieldPath, FieldValues } from "react-hook-form";

import { FormField, type FormFieldProps } from "./form-field";

export type SelectOption<V> = { readonly value: V; readonly label: string };

/** A single choice from a short, fixed list. */
export function SelectField<T extends FieldValues, N extends FieldPath<T>, O, V>({
  options,
  placeholder,
  disabled,
  ...field
}: Omit<FormFieldProps<T, N, O>, "children"> & {
  options: readonly SelectOption<V>[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <FormField {...field}>
      {({ field: control, id, invalid, describedBy }) => (
        <Select
          items={options}
          value={control.value ?? null}
          onValueChange={(value) => control.onChange(value)}
          disabled={disabled}
        >
          <SelectTrigger
            id={id}
            ref={control.ref}
            onBlur={control.onBlur}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className="w-full"
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={String(option.value)} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}
