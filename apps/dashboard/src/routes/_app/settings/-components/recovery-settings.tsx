import { useState } from "react";

import { Button } from "@usepreface/ui/components/button";
import { TrashIcon } from "@usepreface/ui/icons";

import { QueryState } from "#/components/api/query-state";
import { CopyField } from "#/components/data-display/copy-field";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { FormDialog } from "#/components/feedback/form-dialog";
import { Notice } from "#/components/feedback/notice";
import { PageSection } from "#/components/shell/page";
import {
  useOrganizationAuthRecoveryRotate,
  useOrganizationAuthRecoveryRevoke,
} from "#/hooks/identity";
import { useRecovery } from "#/hooks/organizations";
import { formatDate } from "#/lib/dates";

export function RecoverySettings() {
  const recovery = useRecovery();
  const rotate = useOrganizationAuthRecoveryRotate();
  const revoke = useOrganizationAuthRecoveryRevoke();
  const [revoking, setRevoking] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [secret, setSecret] = useState<string>();
  return (
    <PageSection
      className="rounded-xl border bg-surface-1 p-5"
      title="Offline recovery"
      description="Credentials belong to the owner who creates them. Rotation replaces your previous credential."
    >
      <QueryState query={recovery}>
        <p className="text-sm text-fg-secondary">
          {recovery.data?.credential
            ? `Your credential was created ${formatDate(recovery.data.credential.createdAt)}.`
            : "You do not have a recovery credential."}
        </p>
        <div className="flex gap-3">
          <Button type="button" disabled={rotate.pending} onClick={() => setRotating(true)}>
            Generate replacement credential
          </Button>
          {recovery.data?.credential ? (
            <Button
              type="button"
              variant="outline"
              disabled={revoke.pending}
              onClick={() => setRevoking(true)}
            >
              Revoke credential
            </Button>
          ) : null}
        </div>
      </QueryState>
      <ConfirmDialog
        open={rotating}
        onOpenChange={setRotating}
        pending={rotate.pending}
        icon={TrashIcon}
        title="Generate a replacement recovery credential?"
        description="Your previous credential stops working immediately. Save the new credential before closing its dialog."
        confirmLabel="Generate credential"
        onConfirm={async () => {
          const response = await rotate.run({
            payload: {},
          });
          if (response) {
            setRotating(false);
            setSecret(response.value.recoveryCredential);
          }
        }}
      />
      <ConfirmDialog
        open={revoking}
        onOpenChange={setRevoking}
        pending={revoke.pending}
        icon={TrashIcon}
        title="Revoke your recovery credential?"
        description="The server prevents removing the last required recovery path."
        confirmLabel="Revoke credential"
        onConfirm={async () => {
          if (await revoke.run({})) setRevoking(false);
        }}
      />
      {secret ? (
        <FormDialog
          open
          onOpenChange={(open) => {
            if (!open) setSecret(undefined);
          }}
          title="Save your recovery credential"
          description="This is the only time it is shown. Store it securely before closing."
          footer={
            <Button type="button" onClick={() => setSecret(undefined)}>
              I have saved it
            </Button>
          }
        >
          <Notice tone="warning">
            Losing this credential requires generating a replacement while you still have access.
          </Notice>
          <CopyField label="Recovery credential" value={secret} />
        </FormDialog>
      ) : null}
    </PageSection>
  );
}
