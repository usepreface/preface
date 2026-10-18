import type * as React from "react";

import { Input } from "@usepreface/ui/components/input";
import { Textarea } from "@usepreface/ui/components/textarea";
import { cn } from "@usepreface/ui/lib/utils";
import type { FieldPath, FieldValues } from "react-hook-form";

import { FormField, type FormFieldProps } from "./form-field";

type InputProps = Omit<React.ComponentProps<"input">, "name" | "value" | "onChange" | "onBlur">;

/** Inputs on the sign-in and setup screens use the L size from Figma: 40 px tall, 16 px text. */
const sizes = { md: "", lg: "h-10 rounded-lg px-3 text-base md:text-base" } as const;

export function TextField<T extends FieldValues, N extends FieldPath<T>, O>({
  size = "md",
  inputProps,
  leading,
  emptyAsUndefined,
  ...field
}: Omit<FormFieldProps<T, N, O>, "children"> & {
  size?: keyof typeof sizes;
  inputProps?: InputProps;
  /** An icon drawn inside the input, before the text. */
  leading?: React.ReactNode;
  /** Clearing the input removes the value, for optional fields that reject empty strings. */
  emptyAsUndefined?: boolean;
}) {
  return (
    <FormField {...field}>
      {({ field: control, id, invalid, describedBy }) => {
        const input = (
          <Input
            {...inputProps}
            id={id}
            name={control.name}
            ref={control.ref}
            value={control.value ?? ""}
            onChange={(event) =>
              control.onChange(
                emptyAsUndefined && event.target.value === "" ? undefined : event.target.value,
              )
            }
            onBlur={control.onBlur}
            disabled={control.disabled ?? inputProps?.disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(sizes[size], leading ? "pl-9" : null, inputProps?.className)}
          />
        );
        return leading ? (
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-icon-secondary [&_svg]:size-4">
              {leading}
            </span>
            {input}
          </div>
        ) : (
          input
        );
      }}
    </FormField>
  );
}

export function TextareaField<T extends FieldValues, N extends FieldPath<T>, O>({
  textareaProps,
  ...field
}: Omit<FormFieldProps<T, N, O>, "children"> & {
  textareaProps?: Omit<React.ComponentProps<"textarea">, "name" | "value" | "onChange" | "onBlur">;
}) {
  return (
    <FormField {...field}>
      {({ field: control, id, invalid, describedBy }) => (
        <Textarea
          {...textareaProps}
          id={id}
          name={control.name}
          ref={control.ref}
          value={control.value ?? ""}
          onChange={control.onChange}
          onBlur={control.onBlur}
          disabled={control.disabled ?? textareaProps?.disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        />
      )}
    </FormField>
  );
}
