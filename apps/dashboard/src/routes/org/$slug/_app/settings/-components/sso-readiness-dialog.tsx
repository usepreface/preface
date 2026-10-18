import { Button } from "@usepreface/ui/components/button";

import { Checklist, type Check } from "#/components/data-display/checklist";
import { FormDialog } from "#/components/feedback/form-dialog";
import { feedback } from "#/lib/feedback";

/*
 * Requiring SSO can lock people out, so the API refuses until every blocker is cleared. This
 * lists the readiness checks with a way to fix each open one.
 */
export function SsoReadinessDialog({
  open,
  onOpenChange,
  onGenerateCredential,
  onRequire,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateCredential: () => void;
  onRequire: () => void;
}) {
  const checks: Check[] = [
    {
      state: "done",
      title: "Okta connection is active",
      detail: "Tested Oct 17 · 31 sign-ins this week",
    },
    {
      state: "done",
      title: "acme.dev is verified and linked to Okta",
      detail: "Approved by the instance owner Oct 18",
    },
    {
      state: "done",
      title: "17 of 18 members have signed in with Okta",
      detail: "Owen Brooks hasn’t yet. He’s suspended.",
    },
    {
      state: "todo",
      title: "You haven’t signed in with Okta yet",
      detail: "Owners need a working SSO sign-in before requiring it.",
      action: (
        <Button variant="outline" size="sm" onClick={feedback.notConnected}>
          Test sign-in
        </Button>
      ),
    },
    {
      state: "todo",
      title: "No recovery credential",
      detail: "Generate one so an owner can recover if Okta is unavailable.",
      action: (
        <Button variant="outline" size="sm" onClick={onGenerateCredential}>
          Generate
        </Button>
      ),
    },
  ];
  const left = checks.filter((check) => check.state !== "done").length;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Before you require SSO"
      description="Fix these so nobody, including you, gets locked out."
      note={left ? `${left} steps left` : "Ready"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={left > 0} onClick={onRequire}>
            Require SSO
          </Button>
        </>
      }
    >
      <Checklist checks={checks} />
    </FormDialog>
  );
}
