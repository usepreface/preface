import * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { Checkbox } from "@usepreface/ui/components/checkbox";
import { DownloadIcon } from "@usepreface/ui/icons";

import { CopyField } from "#/components/data-display/copy-field";
import { DetailList } from "#/components/data-display/detail-list";
import { FormDialog } from "#/components/feedback/form-dialog";
import { Notice } from "#/components/feedback/notice";
import { me } from "#/components/shell/me";
import { recoveryCredential } from "#/lib/placeholder";

/** The new recovery credential, shown once. Done unlocks after the owner confirms they saved it. */
export function RecoveryCredentialDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [saved, setSaved] = React.useState(false);
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Save your recovery credential"
      description="Use it with an owner’s email code to make SSO optional if your identity provider goes down."
      footer={
        <Button disabled={!saved} onClick={() => onOpenChange(false)}>
          Done
        </Button>
      }
    >
      <Notice tone="warning" title="This is the only time it’s shown">
        Store it in your password manager or a sealed envelope. Preface keeps only a hash.
      </Notice>
      <div className="flex items-center gap-2">
        <CopyField
          value={recoveryCredential}
          label="Recovery credential"
          size="lg"
          className="min-w-0 flex-1"
        />
        <Button variant="ghost" size="sm">
          <DownloadIcon data-icon="inline-start" />
          .txt
        </Button>
      </div>
      <DetailList
        className="rounded-xl border px-3.5"
        labelWidth="w-28"
        items={[
          { label: "Created by", value: me.name },
          { label: "Replaces", value: "Nothing, it’s the first credential" },
          { label: "Works with", value: "Owner email code · single use" },
        ]}
      />
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox checked={saved} onCheckedChange={(checked) => setSaved(checked === true)} />
        I’ve saved it somewhere safe
      </label>
    </FormDialog>
  );
}
