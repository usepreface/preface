import * as React from "react";

import { slugify } from "@usepreface/ui/preface/account-fields";
import type { FieldPath, FieldValues, PathValue, UseFormReturn } from "react-hook-form";

/**
 * Keeps a slug field in step with a name field until the person edits the slug themselves. A
 * form that loads with a slug (editing a saved record) never derives it.
 */
export function useDerivedSlug<T extends FieldValues, O>(
  form: UseFormReturn<T, unknown, O>,
  name: FieldPath<T>,
  slug: FieldPath<T>,
) {
  const value = form.watch(name) as unknown;
  const loaded = React.useRef<boolean | null>(null);

  React.useEffect(() => {
    loaded.current ??= Boolean(form.getValues(slug));
    if (loaded.current || form.getFieldState(slug).isDirty) return;
    const next = slugify(typeof value === "string" ? value : "");
    form.setValue(slug, next as PathValue<T, typeof slug>, {
      shouldValidate: form.formState.isSubmitted,
    });
  }, [form, slug, value]);
}
