import * as React from "react";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import { BookIcon, ChevronRightIcon, PlusIcon } from "@usepreface/ui/icons";
import { NoTeamsIllustration } from "@usepreface/ui/illustrations";

import { PeopleStack } from "#/components/data-display/identity";
import { StatusBadge } from "#/components/data-display/status-badge";
import { TableCard } from "#/components/data-display/table-card";
import { matches, TableToolbar } from "#/components/data-display/table-toolbar";
import { EmptyState } from "#/components/feedback/empty-state";
import { PageTitle } from "#/components/shell/page";
import { feedback } from "#/lib/feedback";
import { teams } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";
import { organizationStatus } from "#/lib/status";

import { SettingsFrame } from "../-components/settings-frame";
import { CreateTeamDialog } from "./-components/team-dialog";
import { TeamTile } from "./-components/team-tile";

export const Route = createFileRoute("/org/$slug/_app/settings/teams/")({
  head: () => ({ meta: [{ title: "Teams · Settings · Preface" }] }),
  validateSearch: previewSearch,
  component: TeamsSettings,
});

const statusOptions = [
  { value: "active", label: "Active teams" },
  { value: "archived", label: "Archived teams" },
  { value: "all", label: "All teams" },
];

/** `?state=create` opens Create team; `?state=empty` shows an organization without teams. */
function TeamsSettings() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const state = previewState(["create", "empty"], Route.useSearch().state);
  const [creating, setCreating] = React.useState(state === "create");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const empty = state === "empty";
  const rows = teams.filter(
    (team) =>
      matches(search, team.name, team.slug) &&
      (status === "all" || (status === "archived") === Boolean(team.archived)),
  );

  return (
    <SettingsFrame
      crumbs={[{ label: "Teams" }]}
      width="full"
      actions={
        empty ? null : (
          <Button onClick={() => setCreating(true)}>
            <PlusIcon data-icon="inline-start" />
            Create team
          </Button>
        )
      }
    >
      <PageTitle
        title="Teams"
        description="Group people to share collections and channels. Team roles decide who manages each team."
      />
      {empty ? (
        <EmptyState
          bordered
          art={<NoTeamsIllustration />}
          title="Create your first team"
          description="Teams let you give Support, Docs or Platform their own collections and channels without sharing everything."
          actions={
            <>
              <Button onClick={() => setCreating(true)}>
                <PlusIcon data-icon="inline-start" />
                Create team
              </Button>
              <Button variant="outline" onClick={feedback.notConnected}>
                <BookIcon data-icon="inline-start" />
                Learn about teams
              </Button>
            </>
          }
        />
      ) : (
        <>
          <TableToolbar
            search={search}
            onSearch={setSearch}
            placeholder="Search teams"
            filters={[
              { label: "Status", value: status, onChange: setStatus, options: statusOptions },
            ]}
          />
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead className="max-lg:hidden">Description</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="max-md:hidden">Status</TableHead>
                  <TableHead className="w-0">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((team) => (
                  <TableRow
                    key={team.slug}
                    className={team.archived ? "cursor-pointer opacity-70" : "cursor-pointer"}
                    onClick={() =>
                      navigate({
                        to: "/org/$slug/settings/teams/$teamId",
                        params: { slug, teamId: team.slug },
                      })
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <TeamTile archived={team.archived} />
                        <div className="flex flex-col">
                          <Link
                            to="/org/$slug/settings/teams/$teamId"
                            params={{ slug, teamId: team.slug }}
                            className="text-sm font-medium text-foreground outline-none hover:underline focus-visible:underline"
                          >
                            {team.name}
                          </Link>
                          <span className="font-mono text-2xs text-fg-tertiary">{team.slug}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-80 truncate text-fg-secondary max-lg:hidden">
                      {team.description}
                    </TableCell>
                    <TableCell>
                      {team.members.length ? (
                        <PeopleStack names={team.members} more={`${team.members.length} members`} />
                      ) : (
                        <span className="text-fg-tertiary">No members</span>
                      )}
                    </TableCell>
                    <TableCell className="max-md:hidden">
                      <StatusBadge
                        status={organizationStatus[team.archived ? "archived" : "active"]}
                      />
                    </TableCell>
                    <TableCell>
                      <ChevronRightIcon className="size-4 text-icon-secondary" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}
      <CreateTeamDialog open={creating} onOpenChange={setCreating} preview={state === "create"} />
    </SettingsFrame>
  );
}
