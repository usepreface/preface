import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import type { OrganizationId } from "@usepreface/protocol";
import { PrefaceMark } from "@usepreface/ui/brand";
import { Badge, BadgeDot } from "@usepreface/ui/components/badge";
import { buttonVariants } from "@usepreface/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import { ActivityIcon, GlobeIcon, PlusIcon } from "@usepreface/ui/icons";
import { LogoTile } from "@usepreface/ui/preface/data-display";

import { Pagination } from "#/components/api/pagination";
import { QueryState } from "#/components/api/query-state";
import { IconTile } from "#/components/data-display/icon-tile";
import { Person } from "#/components/data-display/identity";
import { TableCard } from "#/components/data-display/table-card";
import { Notice } from "#/components/feedback/notice";
import { OrgAvatar } from "#/components/organization/org-avatar";
import { PageTitle, PageSection } from "#/components/shell/page";
import { useOrganizations } from "#/hooks/organizations";
import { formatDate } from "#/lib/dates";

import { InstancePage } from "./-components/instance-page";
import { OverviewCard } from "./-components/overview-card";

export const Route = createFileRoute("/instance/")({ component: Overview });

function Overview() {
  const { instance, actor } = Route.useRouteContext();
  const [cursor, setCursor] = useState<OrganizationId>();
  const organizations = useOrganizations(cursor);

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
        title={instance.instanceName}
        leading={
          <span className="flex size-13 items-center justify-center rounded-[14px] bg-brand-slate">
            <PrefaceMark tone="ice" size={30} title="" />
          </span>
        }
        description={`${window.location.host} · self-hosted`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="flex flex-col gap-3 rounded-xl border bg-surface-1 p-5">
          <h2 className="text-sm font-semibold text-foreground">Instance owner</h2>
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <Person name={actor?.user.metadata.name ?? ""} detail={actor?.user.email} />
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
          detail="Configure, test and activate the instance’s Google OAuth client."
          action="Configure"
          link={{ to: "/instance/authentication" }}
        />
        <section className="flex flex-col gap-2.5 rounded-xl border bg-surface-1 p-5">
          <div className="flex items-center gap-2.5">
            <IconTile icon={GlobeIcon} size={32} />
            <h2 className="text-sm font-semibold text-foreground">Domain claims</h2>
          </div>
          <p className="text-13 text-fg-secondary">
            Open the exact review link supplied by an organization owner. A review queue is not
            available yet.
          </p>
        </section>
        <OverviewCard
          media={<IconTile icon={ActivityIcon} size={32} />}
          title="Instance activity"
          detail="Review instance configuration changes and domain approval history."
          action="Open"
          link={{ to: "/instance/audit" }}
        />
      </div>
      <PageSection
        title="Your organizations"
        description="Only organizations you belong to appear here. Instance ownership does not grant organization membership."
      >
        <QueryState query={organizations}>
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="max-lg:hidden">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.data?.organizations.map((organization) => (
                  <TableRow key={organization.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <OrgAvatar
                          name={organization.metadata.name}
                          size="sm"
                          muted={Boolean(organization.archivedAt)}
                        />
                        <div className="flex flex-col">
                          {organization.archivedAt ? (
                            <span className="text-sm font-medium">
                              {organization.metadata.name}
                            </span>
                          ) : (
                            <Link
                              to="/org/$slug"
                              params={{ slug: organization.slug }}
                              className="text-sm font-medium text-foreground hover:underline"
                            >
                              {organization.metadata.name}
                            </Link>
                          )}
                          <span className="font-mono text-2xs text-fg-tertiary">
                            /org/{organization.slug}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge tone={organization.archivedAt ? "neutral" : "success"}>
                        <BadgeDot />
                        {organization.archivedAt ? "Archived" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-fg-secondary max-lg:hidden">
                      {formatDate(organization.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
          {!organizations.data?.organizations.length ? (
            <Notice>
              No organization memberships yet. Create your first organization to get started.
            </Notice>
          ) : null}
        </QueryState>
        <Pagination
          cursor={cursor}
          nextCursor={organizations.data?.nextCursor}
          onChange={setCursor}
        />
      </PageSection>
    </InstancePage>
  );
}
