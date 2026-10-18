import type * as React from "react";

import { ServerIcon } from "@usepreface/ui/icons";

import { PageBar, PageContent, type Crumb } from "#/components/shell/page";

/** Every instance page: "Instance" first in the breadcrumb, then the page. */
export function InstancePage({
  crumbs,
  actions,
  children,
}: {
  crumbs: Crumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageBar
        crumbs={[{ label: "Instance", icon: ServerIcon, link: { to: "/instance" } }, ...crumbs]}
        actions={actions}
      />
      <PageContent width="full" className="max-w-300">
        {children}
      </PageContent>
    </>
  );
}
