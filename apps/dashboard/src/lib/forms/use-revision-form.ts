import { useEffect, useState } from "react";

import type { FieldValues, UseFormReturn } from "react-hook-form";

export function useRevisionForm<T extends FieldValues>(
  form: Pick<UseFormReturn<T>, "reset" | "formState">,
  savedRevision: number,
  savedValues: T,
) {
  const [revision, setRevision] = useState(savedRevision);
  const dirty = form.formState.isDirty;
  const reset = form.reset;
  const submitting = form.formState.isSubmitting;

  useEffect(() => {
    if (dirty || submitting || savedRevision <= revision) return;
    reset(savedValues);
    setRevision(savedRevision);
  }, [dirty, submitting, savedRevision, revision, savedValues, reset]);

  return {
    revision,
    conflicted: savedRevision > revision,
    reload: () => {
      reset(savedValues);
      setRevision(savedRevision);
    },
    accept: (nextRevision: number, values: T) => {
      form.reset(values);
      setRevision(nextRevision);
    },
  };
}
