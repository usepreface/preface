import { Link } from "@tanstack/react-router";

import { buttonVariants } from "@usepreface/ui/components/button";
import { ArrowRightIcon, LockIcon, PackageIcon, UsersIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

import { ProviderButton } from "#/components/auth/auth-parts";
import { RoleBadge } from "#/components/data-display/identity";
import { OrgAvatar } from "#/components/organization/org-avatar";
import type { OrganizationSummary } from "#/lib/placeholder";
import { organizationUrl } from "#/lib/urls";

const providerName = { okta: "Okta", microsoft: "Microsoft Entra ID" } as const;

/** One organization in the picker. SSO organizations open through their provider first. */
export function OrganizationCard({
  organization,
  primary,
  onRequireSso,
}: {
  organization: OrganizationSummary;
  primary?: boolean;
  onRequireSso?: () => void;
}) {
  const archived = organization.access === "archived";
  const sso = organization.access === "sso" && organization.provider;
  const params = { slug: organization.slug };

  return (
    <article
      className={cn(
        "flex flex-col gap-3.5 rounded-[14px] border bg-surface-1 p-5",
        archived ? "border-border-subtle" : "shadow-xs transition-shadow hover:shadow-sm",
      )}
    >
      <div className="flex items-center gap-3">
        <OrgAvatar name={organization.name} size="lg" muted={archived} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2
            className={cn(
              "truncate text-base font-medium",
              archived ? "text-fg-secondary" : "text-foreground",
            )}
          >
            {organization.name}
          </h2>
          <span className="truncate font-mono text-2xs text-fg-tertiary">
            {organizationUrl(organization.slug)}
          </span>
        </div>
        <RoleBadge role={organization.role} />
      </div>
      <p className="text-sm text-fg-secondary">{organization.description}</p>
      <div className="mt-auto flex items-center gap-2 border-t pt-3">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-caption text-fg-tertiary">
          {sso ? (
            <>
              <LockIcon className="size-3.5 text-warning-fg" />
              <span className="font-medium text-warning-fg">
                {providerName[sso]} sign-in required
              </span>
            </>
          ) : archived ? (
            <>
              <PackageIcon className="size-3.5 text-icon-secondary" />
              {organization.note} · read-only
            </>
          ) : (
            <>
              <UsersIcon className="size-3.5 text-icon-secondary" />
              {organization.members} members
              {organization.note ? ` · ${organization.note.toLowerCase()}` : null}
            </>
          )}
        </span>
        {sso ? (
          <ProviderButton brand={sso} size="sm" onClick={onRequireSso}>
            Continue with {providerName[sso]}
          </ProviderButton>
        ) : archived ? (
          <Link
            to="/org/$slug"
            params={params}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View
          </Link>
        ) : (
          <Link
            to="/org/$slug"
            params={params}
            className={buttonVariants({ variant: primary ? "default" : "outline", size: "sm" })}
          >
            Open
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        )}
      </div>
    </article>
  );
}

/** The placeholder card while organizations load. */
export function OrganizationCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3.5 rounded-[14px] border border-border-subtle bg-surface-1 p-5"
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <span className="size-10 animate-pulse rounded-[10px] bg-surface-3" />
        <span className="flex flex-col gap-2">
          <span className="h-3 w-40 animate-pulse rounded-full bg-surface-3" />
          <span className="h-2.5 w-56 animate-pulse rounded-full bg-surface-2" />
        </span>
      </div>
      <span className="h-2.5 w-full animate-pulse rounded-full bg-surface-2" />
      <span className="h-2.5 w-2/3 animate-pulse rounded-full bg-surface-2" />
      <div className="flex items-center justify-between border-t pt-3">
        <span className="h-2.5 w-30 animate-pulse rounded-full bg-surface-2" />
        <span className="h-7 w-16 animate-pulse rounded-md bg-surface-3" />
      </div>
    </div>
  );
}
