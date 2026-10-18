import { Input } from "@usepreface/ui/components/input";
import { Label } from "@usepreface/ui/components/label";
import { AlertIcon } from "@usepreface/ui/icons";

import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { feedback } from "#/lib/feedback";
import { type Member } from "#/lib/placeholder";

export function SuspendDialog({ member, onClose }: { member: Member; onClose: () => void }) {
  const first = member.name.split(" ")[0];
  return (
    <ConfirmDialog
      open
      onOpenChange={onClose}
      icon={AlertIcon}
      tone="warning"
      title={`Suspend ${member.name}?`}
      description={`${first} is signed out everywhere and can’t sign in until you reinstate them. Their conversations, sources and team memberships stay as they are.`}
      confirmLabel="Suspend member"
      onConfirm={() => feedback.done(`${member.name} suspended`)}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="suspend-reason">
          Reason <span className="font-normal text-fg-tertiary">Optional</span>
        </Label>
        <Input id="suspend-reason" placeholder="Left for parental leave, back in January" />
        <p className="text-caption text-fg-tertiary">Shown in the activity log, not to {first}.</p>
      </div>
    </ConfirmDialog>
  );
}
