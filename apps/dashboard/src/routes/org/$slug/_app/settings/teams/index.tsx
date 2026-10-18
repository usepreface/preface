import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import type { TeamId } from "@usepreface/protocol";
import { Badge, BadgeDot } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import { ChevronRightIcon, PlusIcon } from "@usepreface/ui/icons";
import { NoTeamsIllustration } from "@usepreface/ui/illustrations";

import { Pagination } from "#/components/api/pagination";
import { Permission } from "#/components/api/permission";
import { QueryState } from "#/components/api/query-state";
import { TableCard } from "#/components/data-display/table-card";
import { TableToolbar, matches } from "#/components/data-display/table-toolbar";
import { EmptyState } from "#/components/feedback/empty-state";
import { PageTitle } from "#/components/shell/page";
import { useOrganization, useTeams } from "#/hooks/organizations";

import { SettingsFrame } from "../-components/settings-frame";
import { TeamDialog } from "./-components/team-dialog";
import { TeamTile } from "./-components/team-tile";

export const Route = createFileRoute("/org/$slug/_app/settings/teams/")({
  component: () => (
    <Permission permission="teams.read">
      <Teams />
    </Permission>
  ),
});

function Teams() {
  const { organization, access } = useOrganization();
  const [cursor, setCursor] = useState<TeamId>();
  const query = useTeams(organization.id, cursor);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const rows = query.data?.teams.filter(
    (team) =>
      matches(search, team.metadata.name, team.slug) &&
      (status === "all" || (status === "archived") === Boolean(team.archivedAt)),
  );
  const canCreate = access.permissions.includes("teams.manage");
  const empty = query.data?.teams.length === 0;

  return (
    <SettingsFrame
      crumbs={[{ label: "Teams" }]}
      width="full"
      actions={
        canCreate && !empty ? (
          <Button onClick={() => setCreating(true)}>
            <PlusIcon data-icon="inline-start" />
            Create team
          </Button>
        ) : null
      }
    >
      <PageTitle
        title="Teams"
        description="Group people into teams. Team roles decide who manages each team."
      />
      <QueryState query={query}>
        {empty ? (
          <EmptyState
            bordered
            art={<NoTeamsIllustration />}
            title="Create your first team"
            description="Give Support, Docs or Platform their own team and assign the people who manage it."
            actions={
              canCreate ? (
                <Button onClick={() => setCreating(true)}>
                  <PlusIcon data-icon="inline-start" />
                  Create team
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <TableToolbar
              search={search}
              onSearch={setSearch}
              placeholder="Search teams on this page"
              filters={[
                {
                  label: "Status",
                  value: status,
                  onChange: setStatus,
                  options: [
                    { value: "active", label: "Active teams" },
                    { value: "archived", label: "Archived teams" },
                    { value: "all", label: "All teams" },
                  ],
                },
              ]}
            />
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead className="max-lg:hidden">Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-0">
                      <span className="sr-only">Open</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows?.map((team) => (
                    <TableRow key={team.id} className={team.archivedAt ? "opacity-70" : undefined}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <TeamTile archived={Boolean(team.archivedAt)} />
                          <div className="flex flex-col">
                            {team.archivedAt ? (
                              <span className="text-sm font-medium">{team.metadata.name}</span>
                            ) : (
                              <Link
                                to="/org/$slug/settings/teams/$teamId"
                                params={{ slug: organization.slug, teamId: team.id }}
                                className="text-sm font-medium text-foreground outline-none hover:underline focus-visible:underline"
                              >
                                {team.metadata.name}
                              </Link>
                            )}
                            <span className="font-mono text-2xs text-fg-tertiary">{team.slug}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-80 truncate text-fg-secondary max-lg:hidden">
                        {team.metadata.description}
                      </TableCell>
                      <TableCell>
                        <Badge tone={team.archivedAt ? "neutral" : "success"}>
                          <BadgeDot />
                          {team.archivedAt ? "Archived" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!team.archivedAt ? (
                          <Link
                            to="/org/$slug/settings/teams/$teamId"
                            params={{ slug: organization.slug, teamId: team.id }}
                            aria-label={`Open ${team.metadata.name}`}
                          >
                            <ChevronRightIcon className="size-4 text-icon-secondary" />
                          </Link>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
            {!rows?.length ? (
              <p className="text-sm text-fg-secondary">
                No teams match these filters on this page.
              </p>
            ) : null}
          </>
        )}
      </QueryState>
      <Pagination cursor={cursor} nextCursor={query.data?.nextCursor} onChange={setCursor} />
      {creating ? <TeamDialog onClose={() => setCreating(false)} /> : null}
    </SettingsFrame>
  );
}
