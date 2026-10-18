import { UrlSlugInput, type SlugStatus } from "@usepreface/ui/preface/account-fields";
import type { FieldPath, FieldValues } from "react-hook-form";

import { FormField, type FormFieldProps } from "./form-field";

/**
 * A URL slug after a fixed prefix. With `source`, the slug follows that value (usually the name)
 * until the person edits it.
 */
export function SlugField<T extends FieldValues, N extends FieldPath<T>, O>({
  prefix,
  source,
  status,
  disabled,
  ...field
}: Omit<FormFieldProps<T, N, O>, "children"> & {
  prefix: string;
  source?: string;
  status?: SlugStatus;
  disabled?: boolean;
}) {
  return (
    <FormField {...field}>
      {({ field: control, id, invalid, describedBy }) => (
        <UrlSlugInput
          id={id}
          prefix={prefix}
          source={source}
          value={control.value ?? ""}
          onValueChange={(slug) => control.onChange(slug)}
          onBlur={control.onBlur}
          disabled={disabled}
          status={invalid ? "taken" : status}
          aria-describedby={describedBy}
        />
      )}
    </FormField>
  );
}
