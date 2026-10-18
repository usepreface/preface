import * as React from "react";

import { createFileRoute, notFound } from "@tanstack/react-router";

import { Counter } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";
import { PlusIcon } from "@usepreface/ui/icons";
import { InlineCode } from "@usepreface/ui/preface/data-display";

import { teamMembers, teams } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

import { SettingsFrame } from "../-components/settings-frame";
import { AddTeamMembersDialog } from "./-components/add-members-dialog";
import { TeamMembersTable } from "./-components/team-members-table";
import { TeamSettings } from "./-components/team-settings";
import { TeamTile } from "./-components/team-tile";
export const Route = createFileRoute("/org/$slug/_app/settings/teams/$teamId")({
  head: () => ({ meta: [{ title: "Team · Settings · Preface" }] }),
  validateSearch: previewSearch,
  loader: ({ params }) => {
    const team = teams.find((candidate) => candidate.slug === params.teamId);
    if (!team) throw notFound();
    return team;
  },
  component: TeamDetail,
});

/** One team. `?state=add` opens Add members, `?state=settings` and `?state=archive` the settings tab. */
function TeamDetail() {
  const { slug } = Route.useParams();
  const team = Route.useLoaderData();
  const state = previewState(["add", "settings", "archive"], Route.useSearch().state);
  const [adding, setAdding] = React.useState(state === "add");
  const [tab, setTab] = React.useState(
    state === "settings" || state === "archive" ? "settings" : "members",
  );

  return (
    <SettingsFrame
      crumbs={[
        { label: "Teams", link: { to: "/org/$slug/settings/teams", params: { slug } } },
        { label: team.name },
      ]}
      width="full"
      actions={
        tab === "members" ? (
          <Button onClick={() => setAdding(true)}>
            <PlusIcon data-icon="inline-start" />
            Add members
          </Button>
        ) : null
      }
    >
      <div className="flex items-center gap-3.5">
        <TeamTile size="lg" archived={team.archived} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-heading-2 text-foreground">{team.name}</h1>
            <InlineCode>{team.slug}</InlineCode>
          </div>
          <p className="text-sm text-fg-secondary">{team.description}</p>
        </div>
      </div>
      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <TabsList variant="line">
          <TabsTrigger value="members">
            Members <Counter>{teamMembers.length}</Counter>
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="pt-4">
          <TeamMembersTable />
        </TabsContent>
        <TabsContent value="settings" className="flex flex-col gap-5 pt-4 lg:max-w-200">
          <TeamSettings team={team} archiving={state === "archive"} />
        </TabsContent>
      </Tabs>
      <AddTeamMembersDialog
        team={team}
        open={adding}
        onOpenChange={setAdding}
        preview={state === "add"}
      />
    </SettingsFrame>
  );
}
