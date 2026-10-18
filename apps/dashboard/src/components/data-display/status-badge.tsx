import { Badge, BadgeDot } from "@usepreface/ui/components/badge";

import type { StatusLook } from "#/lib/status";

/** A lifecycle state as a badge. Pass an entry from one of the tables in `#/lib/status`. */
export function StatusBadge({ status }: { status: StatusLook }) {
  return (
    <Badge tone={status.tone}>
      {status.dot ? <BadgeDot /> : null}
      {status.label}
    </Badge>
  );
}
