import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@usepreface/ui/components/input-otp";
import type { FieldPath, FieldValues } from "react-hook-form";

import { FormField, type FormFieldProps } from "./form-field";

const DIGITS = 8;

/** The 8-digit email code, in two groups of four. Pasting a whole code fills every slot. */
export function CodeField<T extends FieldValues, N extends FieldPath<T>, O>({
  disabled,
  ...field
}: Omit<FormFieldProps<T, N, O>, "children"> & { disabled?: boolean }) {
  return (
    <FormField {...field}>
      {({ field: control, id, invalid, describedBy }) => (
        <InputOTP
          id={id}
          name={control.name}
          ref={control.ref}
          value={control.value ?? ""}
          onChange={control.onChange}
          onBlur={control.onBlur}
          disabled={disabled}
          maxLength={DIGITS}
          inputMode="numeric"
          pattern="^[0-9]*$"
          autoComplete="one-time-code"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          containerClassName="gap-2.5"
        >
          {[0, 4].map((start, group) => (
            <span key={start} className="contents">
              {group > 0 ? <InputOTPSeparator /> : null}
              <InputOTPGroup>
                {Array.from({ length: DIGITS / 2 }, (_, index) => (
                  <InputOTPSlot
                    key={start + index}
                    index={start + index}
                    aria-invalid={invalid || undefined}
                  />
                ))}
              </InputOTPGroup>
            </span>
          ))}
        </InputOTP>
      )}
    </FormField>
  );
}
