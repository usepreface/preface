import * as React from "react";

import { CloseIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import type { FieldPath, FieldValues } from "react-hook-form";

import { FormField, type FormFieldProps } from "./form-field";

/**
 * Several email addresses as chips. Enter, comma, space or paste adds them; Backspace on an
 * empty input removes the last one. The field value is the array of addresses.
 */
export function EmailListField<T extends FieldValues, N extends FieldPath<T>, O>({
  placeholder = "Add emails…",
  ...field
}: Omit<FormFieldProps<T, N, O>, "children"> & { placeholder?: string }) {
  const [draft, setDraft] = React.useState("");
  return (
    <FormField {...field}>
      {({ field: control, id, invalid, describedBy }) => {
        const emails: string[] = control.value ?? [];
        const commit = (text: string) => {
          const added = text
            .split(/[\s,;]+/)
            .map((email) => email.trim())
            .filter((email) => email && !emails.includes(email));
          if (added.length) control.onChange([...emails, ...added]);
          setDraft("");
        };
        return (
          <div
            className={cn(
              "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5",
              "transition-[box-shadow,border-color] hover:border-border-strong",
              "focus-within:border-ring focus-within:ring-3 focus-within:ring-focus-ring",
              invalid ? "border-destructive ring-3 ring-danger/25" : null,
            )}
          >
            {emails.map((email) => (
              <span
                key={email}
                className="flex items-center gap-1 rounded-md bg-surface-3 py-0.5 pr-1 pl-2 text-sm text-foreground"
              >
                {email}
                <button
                  type="button"
                  aria-label={`Remove ${email}`}
                  className="rounded-sm p-0.5 text-icon-secondary hover:bg-hover hover:text-icon"
                  onClick={() => control.onChange(emails.filter((value) => value !== email))}
                >
                  <CloseIcon className="size-3" />
                </button>
              </span>
            ))}
            <input
              id={id}
              ref={control.ref}
              value={draft}
              type="email"
              multiple
              placeholder={emails.length ? "Add more emails…" : placeholder}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className="min-w-40 flex-1 bg-transparent py-0.5 text-sm text-foreground outline-none placeholder:text-fg-tertiary"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (["Enter", ",", " ", ";"].includes(event.key)) {
                  event.preventDefault();
                  commit(draft);
                } else if (event.key === "Backspace" && !draft && emails.length) {
                  control.onChange(emails.slice(0, -1));
                }
              }}
              onPaste={(event) => {
                event.preventDefault();
                commit(draft + event.clipboardData.getData("text"));
              }}
              onBlur={() => {
                if (draft) commit(draft);
                control.onBlur();
              }}
            />
          </div>
        );
      }}
    </FormField>
  );
}
