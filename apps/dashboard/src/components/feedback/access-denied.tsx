import type * as React from "react";

import { AccessDeniedIllustration } from "@usepreface/ui/illustrations";

import { EmptyState } from "./empty-state";

/** In place of a page the person's roles don't allow: why, and where to go instead. */
export function AccessDenied({
  title = "You don’t have access to this page",
  description,
  actions,
}: {
  title?: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <EmptyState
      className="py-16"
      art={<AccessDeniedIllustration />}
      title={title}
      description={description}
      actions={actions}
    />
  );
}
