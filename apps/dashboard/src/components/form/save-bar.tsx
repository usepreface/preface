import type * as React from "react";

import { Button } from "@usepreface/ui/components/button";

import { FormActions } from "./form-actions";
import { SubmitButton } from "./submit-button";

/**
 * The footer of a settings form: an "Unsaved changes" marker while the form is dirty, then
 * Cancel (back to the saved values) and Save. Both stay disabled until something changes.
 */
export function SaveBar({
  dirty,
  pending,
  onReset,
  saveLabel = "Save changes",
  note,
}: {
  dirty: boolean;
  pending?: boolean;
  onReset: () => void;
  saveLabel?: string;
  note?: React.ReactNode;
}) {
  return (
    <FormActions
      note={
        dirty ? (
          <span className="flex items-center gap-1.5 text-fg-secondary" aria-live="polite">
            <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
            Unsaved changes
          </span>
        ) : (
          note
        )
      }
    >
      <Button type="button" variant="ghost" disabled={!dirty || pending} onClick={onReset}>
        Cancel
      </Button>
      <SubmitButton disabled={!dirty} pending={pending} pendingLabel="Saving…">
        {saveLabel}
      </SubmitButton>
    </FormActions>
  );
}
