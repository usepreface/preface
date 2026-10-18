import { Button } from "@usepreface/ui/components/button";
import { CheckCircleIcon, RefreshIcon, XCircleIcon } from "@usepreface/ui/icons";

import { StatusIcon } from "#/components/auth/status-page";
import { Checklist } from "#/components/data-display/checklist";
import { CopyField } from "#/components/data-display/copy-field";
import { DetailList } from "#/components/data-display/detail-list";
import { FormSheet } from "#/components/feedback/form-dialog";
import { Notice } from "#/components/feedback/notice";
import { feedback } from "#/lib/feedback";
import { connectionDetails, type SsoConnection } from "#/lib/placeholder";

/** The result of a test sign-in: each check, then the claims or what didn't match. */
export function TestResultSheet({
  connection,
  passed,
  open,
  onOpenChange,
}: {
  connection: SsoConnection;
  passed: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { clientId } = connectionDetails.oidc;
  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      media={
        <StatusIcon
          icon={passed ? CheckCircleIcon : XCircleIcon}
          tone={passed ? "success" : "danger"}
          size="sm"
        />
      }
      title={passed ? "Test passed" : "Test failed"}
      description={`${connection.name} · Oct 18, 23:14 · signed in as jon@contractors.acme.dev`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {passed ? (
            <Button onClick={feedback.notConnected}>Activate connection</Button>
          ) : (
            <Button onClick={feedback.notConnected}>
              <RefreshIcon data-icon="inline-start" />
              Test again
            </Button>
          )}
        </>
      }
    >
      <Checklist
        checks={
          passed
            ? [
                {
                  state: "done",
                  title: `Reached ${connection.name}`,
                  detail: "Discovery document and keys loaded",
                },
                { state: "done", title: "Token signature is valid", detail: "RS256 · key 7Fz…" },
                {
                  state: "done",
                  title: "Email matches a verified domain",
                  detail: "jon@contractors.acme.dev → contractors.acme.dev",
                },
                {
                  state: "done",
                  title: "Required claims present",
                  detail: "email, email_verified, name, sub",
                },
              ]
            : [
                {
                  state: "done",
                  title: `Reached ${connection.name}`,
                  detail: "Discovery document and keys loaded",
                },
                {
                  state: "failed",
                  title: "Audience doesn’t match",
                  detail: "The token was issued for a different client ID.",
                },
                { state: "waiting", title: "Email domain", detail: "Skipped" },
                { state: "waiting", title: "Required claims", detail: "Skipped" },
              ]
        }
      />
      {passed ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-foreground">Claims received</h3>
          <DetailList
            className="rounded-xl border px-3.5"
            labelWidth="w-30 font-mono"
            items={[
              { label: "email", value: "jon@contractors.acme.dev", mono: true },
              { label: "email_verified", value: "true", mono: true },
              { label: "name", value: "Jon Smith", mono: true },
              { label: "sub", value: "a91f…c03e", mono: true },
            ]}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-foreground">What we compared</h3>
          <div className="flex flex-col gap-1.5">
            <span className="text-13 text-fg-secondary">Expected (your client ID)</span>
            <CopyField value={clientId} label="Expected client ID" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-13 text-fg-secondary">Received (aud claim)</span>
            <CopyField value="api://preface-old-registration" label="Received audience" />
          </div>
          <Notice tone="warning" title="How to fix">
            {connection.name} is issuing tokens for an older app registration. Update the client ID,
            or set the token audience in {connection.name} to this client ID, then test again.
          </Notice>
        </div>
      )}
    </FormSheet>
  );
}
