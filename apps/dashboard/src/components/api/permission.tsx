import type { ReactNode } from "react";

import type { OrganizationPermission } from "@usepreface/protocol";

import { AccessDenied } from "#/components/feedback/access-denied";
import { useOrganization } from "#/hooks/organizations";

export function Permission({
  permission,
  owner = false,
  children,
}: {
  permission?: OrganizationPermission;
  owner?: boolean;
  children: ReactNode;
}) {
  const { access } = useOrganization();
  if ((owner && !access.isOwner) || (permission && !access.permissions.includes(permission)))
    return (
      <AccessDenied description="Your current organization role does not grant access to this page." />
    );
  return children;
}
