import { createFileRoute, Link } from "@tanstack/react-router";

import { PrefaceMark } from "@usepreface/ui/brand";
import { Badge } from "@usepreface/ui/components/badge";
import { buttonVariants } from "@usepreface/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import { ActivityIcon, GlobeIcon, HomeIcon, PlusIcon } from "@usepreface/ui/icons";
import { LogoTile } from "@usepreface/ui/preface/data-display";

import { IconTile } from "#/components/data-display/icon-tile";
import { Person } from "#/components/data-display/identity";
import { StatusBadge } from "#/components/data-display/status-badge";
import { TableCard } from "#/components/data-display/table-card";
import { AccessDenied } from "#/components/feedback/access-denied";
import { OrgAvatar } from "#/components/organization/org-avatar";
import { me } from "#/components/shell/me";
import { PageSection, PageTitle } from "#/components/shell/page";
import {
  domainClaims,
  googleConnection,
  instanceActivity,
  instanceOrganizations,
  placeholder,
} from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";
import { organizationStatus } from "#/lib/status";

import { InstancePage } from "./-components/instance-page";
import { OverviewCard } from "./-components/overview-card";
export const Route = createFileRoute("/instance/")({
  head: () => ({ meta: [{ title: "Instance · Preface" }] }),
  validateSearch: previewSearch,
  component: InstanceOverview,
});

/** The instance at a glance. `?state=owners-only` shows what everyone else sees here. */
function InstanceOverview() {
  const ownersOnly = previewState(["owners-only"], Route.useSearch().state) === "owners-only";
  if (ownersOnly) return <OwnersOnly />;

  const { instance } = placeholder;
  const waiting = domainClaims.filter((claim) => !claim.approved);
  const claim = waiting[0] ?? domainClaims[0];

  return (
    <InstancePage
      crumbs={[{ label: "Overview" }]}
      actions={
        <Link to="/organizations/new" className={buttonVariants()}>
          <PlusIcon data-icon="inline-start" />
          Create organization
        </Link>
      }
    >
      <PageTitle
        leading={
          <span className="flex size-13 items-center justify-center rounded-[14px] bg-brand-slate">
            <PrefaceMark tone="ice" size={30} title="" />
          </span>
        }
        title={instance.name}
        badges={
          <>
            <Badge variant="outline">{instance.version}</Badge>
            <StatusBadge status={{ label: "Healthy", tone: "success", dot: true }} />
          </>
        }
        description={`${instance.host} · self-hosted · 1 worker · Postgres 16`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="flex flex-col gap-3 rounded-xl border bg-surface-1 p-5">
          <h2 className="text-sm font-semibold text-foreground">Instance owner</h2>
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <Person name={me.name} detail={me.email} />
            </div>
            <Badge tone="info">Owner</Badge>
          </div>
          <p className="text-caption text-fg-tertiary">
            Instance owners create organizations, configure Google sign-in and approve domain
            claims.
          </p>
        </section>
        <OverviewCard
          media={<LogoTile brand="google" size={32} />}
          title="Google sign-in"
          detail={`Tested Oct 12 · used by ${googleConnection.usedBy.split(", ").length} organizations`}
          badge={<StatusBadge status={{ label: "Active", tone: "success", dot: true }} />}
          action="Configure"
          link={{ to: "/instance/authentication" }}
        />
        <OverviewCard
          media={<IconTile icon={GlobeIcon} size={32} />}
          title="Domain claims"
          detail={
            waiting.length ? `${claim.domain} is waiting for review` : "Nothing waiting for review"
          }
          badge={
            waiting.length ? (
              <StatusBadge
                status={{ label: `${waiting.length} waiting`, tone: "warning", dot: true }}
              />
            ) : null
          }
          action="Review"
          link={{
            to: "/instance/domains/$organizationId/$domainId",
            params: { organizationId: claim.organization, domainId: claim.domain },
          }}
        />
        <OverviewCard
          media={<IconTile icon={ActivityIcon} size={32} />}
          title="Instance activity"
          detail={`Last event ${instanceActivity[0]?.time ?? "never"}`}
          action="Open"
          link={{ to: "/instance/audit" }}
        />
      </div>
      <PageSection title="Organizations">
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead className="max-md:hidden">Owner</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="max-lg:hidden">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instanceOrganizations.map((organization) => {
                const archived = organization.status === "archived";
                return (
                  <TableRow key={organization.slug} className={archived ? "opacity-70" : undefined}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <OrgAvatar
                          name={organization.name}
                          size="sm"
                          muted={archived}
                          className="size-7"
                        />
                        <div className="flex flex-col">
                          <Link
                            to="/org/$slug"
                            params={{ slug: organization.slug }}
                            className="text-sm font-medium text-foreground hover:underline"
                          >
                            {organization.name}
                          </Link>
                          <span className="font-mono text-2xs text-fg-tertiary">
                            /org/{organization.slug}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-fg-secondary max-md:hidden">
                      {organization.owner}
                    </TableCell>
                    <TableCell className="text-fg-secondary">{organization.members}</TableCell>
                    <TableCell>
                      <StatusBadge status={organizationStatus[organization.status]} />
                    </TableCell>
                    <TableCell className="text-fg-secondary max-lg:hidden">
                      {organization.created}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      </PageSection>
    </InstancePage>
  );
}

function OwnersOnly() {
  const { slug, name } = placeholder.organization;
  return (
    <InstancePage crumbs={[]}>
      <AccessDenied
        title="Only instance owners can open this"
        description={`Instance settings control sign-in and domains for every organization on ${placeholder.instance.host}. Ask ${me.name} if you need a change.`}
        actions={
          <Link to="/org/$slug" params={{ slug }} className={buttonVariants()}>
            <HomeIcon data-icon="inline-start" />
            Back to {name}
          </Link>
        }
      />
    </InstancePage>
  );
}
