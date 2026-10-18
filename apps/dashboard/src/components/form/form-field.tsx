import * as React from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@usepreface/ui/components/field";
import { cn } from "@usepreface/ui/lib/utils";
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

export type FieldControlProps<T extends FieldValues, N extends FieldPath<T>> = {
  field: ControllerRenderProps<T, N>;
  id: string;
  invalid: boolean;
  /** ids of the description and error, for the control's aria-describedby. */
  describedBy: string | undefined;
};

export type FormFieldProps<T extends FieldValues, N extends FieldPath<T>, O> = {
  control: Control<T, unknown, O>;
  name: N;
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Marks the field optional next to its label. */
  optional?: boolean;
  /** Something next to the label, such as a read-only badge. */
  labelExtra?: React.ReactNode;
  className?: string;
  children: (props: FieldControlProps<T, N>) => React.ReactNode;
};

/**
 * A labelled form control bound to react-hook-form. The schema's message for the field shows
 * under it, announced to screen readers, and the control is marked invalid while it has one.
 */
export function FormField<T extends FieldValues, N extends FieldPath<T>, O>({
  control,
  name,
  label,
  description,
  optional,
  labelExtra,
  className,
  children,
}: FormFieldProps<T, N, O>) {
  const id = React.useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const invalid = fieldState.invalid;
        const describedBy =
          [description ? descriptionId : null, invalid ? errorId : null]
            .filter(Boolean)
            .join(" ") || undefined;

        return (
          <Field data-invalid={invalid} className={cn("gap-1.5", className)}>
            <div className="flex items-center gap-2">
              <FieldLabel htmlFor={id}>{label}</FieldLabel>
              {optional ? <span className="text-caption text-fg-tertiary">Optional</span> : null}
              {labelExtra}
            </div>
            {children({ field, id, invalid, describedBy })}
            {description ? (
              <FieldDescription id={descriptionId} className="text-caption text-fg-tertiary">
                {description}
              </FieldDescription>
            ) : null}
            <FieldError id={errorId} errors={[fieldState.error]} className="text-caption" />
          </Field>
        );
      }}
    />
  );
}
