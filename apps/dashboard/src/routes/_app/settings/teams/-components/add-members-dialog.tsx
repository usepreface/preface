/* oxlint-disable no-await-in-loop -- Preserve successful partial changes and stop after the first rejected mutation. */
import { useState } from "react";

import type { OrganizationMemberId, TeamId } from "@usepreface/protocol";
import { Button } from "@usepreface/ui/components/button";

import { QueryState } from "#/components/api/query-state";
import { FormDialog } from "#/components/feedback/form-dialog";
import { useAllMembers, useTeamsAddMember } from "#/hooks/membership";

export function AddMembersDialog({ teamId, onClose }: { teamId: TeamId; onClose: () => void }) {
  const members = useAllMembers();
  const add = useTeamsAddMember();
  const [selected, setSelected] = useState<readonly OrganizationMemberId[]>([]);
  const [submitting, setSubmitting] = useState(false);
  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open && !submitting) onClose();
      }}
      title="Add team members"
      description="Choose existing active organization members. New team members receive the built-in team member role."
      footer={
        <Button
          disabled={!selected.length || submitting}
          onClick={async () => {
            setSubmitting(true);
            try {
              for (const memberId of selected) {
                if (
                  !(await add.run({
                    params: { teamId, memberId },
                    payload: {},
                  }))
                )
                  return;
                setSelected((previous) => previous.filter((id) => id !== memberId));
              }
              onClose();
            } finally {
              setSubmitting(false);
            }
          }}
        >
          Add selected members
        </Button>
      }
    >
      <QueryState query={members}>
        <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
          {members.data
            ?.filter((member) => !member.suspendedAt && !member.removedAt)
            .map((member) => (
              <label key={member.id} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(member.id)}
                  disabled={submitting}
                  onChange={(event) =>
                    setSelected((previous) =>
                      event.target.checked
                        ? [...previous, member.id]
                        : previous.filter((id) => id !== member.id),
                    )
                  }
                />
                {member.metadata.name}
              </label>
            ))}
        </div>
      </QueryState>
    </FormDialog>
  );
}
