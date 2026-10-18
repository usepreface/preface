import type * as React from "react";

import { Switch } from "@usepreface/ui/components/switch";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

/*
 * A setting that is on or off: media, title and description on the left, the switch on the
 * right. Rows stack with a hairline between them, like the settings rows in the UI kit.
 */
export function SwitchField<T extends FieldValues, N extends FieldPath<T>, O>({
  control,
  name,
  media,
  title,
  description,
  badges,
  disabled,
}: {
  control: Control<T, unknown, O>;
  name: N;
  media?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  badges?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center gap-3.5 border-b py-3.5 last:border-b-0">
          {media}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
              {title}
              {badges}
            </span>
            {description ? <span className="text-13 text-fg-secondary">{description}</span> : null}
          </span>
          <Switch
            ref={field.ref}
            checked={field.value === true}
            onCheckedChange={(checked) => field.onChange(checked)}
            onBlur={field.onBlur}
            disabled={disabled || field.disabled}
          />
        </label>
      )}
    />
  );
}

/** The same row for a switch that isn't part of a form, such as a fixed setting. */
export function SwitchRow({
  media,
  title,
  description,
  badges,
  checked,
  disabled,
}: {
  media?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  badges?: React.ReactNode;
  checked: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b py-3.5 last:border-b-0">
      {media}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
          {title}
          {badges}
        </span>
        {description ? <span className="text-13 text-fg-secondary">{description}</span> : null}
      </span>
      <Switch checked={checked} disabled={disabled} aria-label={title} />
    </div>
  );
}
