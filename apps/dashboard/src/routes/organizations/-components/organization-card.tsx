import { Link } from "@tanstack/react-router";

import type { PublicOrganization } from "@usepreface/protocol/dto";
import { Button, buttonVariants } from "@usepreface/ui/components/button";

import { OrgAvatar } from "#/components/organization/org-avatar";
import { useRestoreOrganization } from "#/hooks/organizations";
import { organizationUrl } from "#/lib/urls";

export function OrganizationCard({ organization }: { organization: PublicOrganization }) {
  const restore = useRestoreOrganization();
  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-surface-1 p-5">
      <div className="flex items-center gap-3">
        <OrgAvatar name={organization.metadata.name} size="lg" />
        <div className="min-w-0">
          <h2 className="text-base font-medium">{organization.metadata.name}</h2>
          <p className="truncate text-xs text-fg-tertiary">{organizationUrl(organization.slug)}</p>
        </div>
      </div>
      <p className="text-sm text-fg-secondary">{organization.metadata.description}</p>
      <div className="mt-auto flex items-center justify-between border-t pt-3">
        <span className="text-xs text-fg-tertiary">
          {organization.archivedAt ? "Archived" : "Organization"}
        </span>
        {organization.archivedAt ? (
          <Button
            size="sm"
            variant="outline"
            disabled={restore.pending}
            onClick={() =>
              void restore.run({ params: { organizationId: organization.id }, payload: {} })
            }
          >
            Restore
          </Button>
        ) : (
          <Link
            to="/org/$slug"
            params={{ slug: organization.slug }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Open
          </Link>
        )}
      </div>
    </article>
  );
}
