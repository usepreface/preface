import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import type { TeamId } from "@usepreface/protocol";
import { Button, buttonVariants } from "@usepreface/ui/components/button";

import { Pagination } from "#/components/api/pagination";
import { Permission } from "#/components/api/permission";
import { QueryState } from "#/components/api/query-state";
import { PageTitle } from "#/components/shell/page";
import { useOrganization, useTeams } from "#/hooks/organizations";

import { SettingsFrame } from "../-components/settings-frame";
import { TeamDialog } from "./-components/team-dialog";

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
  return (
    <SettingsFrame
      crumbs={[{ label: "Teams" }]}
      actions={
        access.permissions.includes("teams.manage") ? (
          <Button onClick={() => setCreating(true)}>Create team</Button>
        ) : null
      }
    >
      <PageTitle title="Teams" description="Organize members into teams with their own roles." />
      <QueryState query={query}>
        <div className="grid gap-4 md:grid-cols-2">
          {query.data?.teams.map((team) => (
            <article key={team.id} className="flex flex-col gap-3 rounded-xl border p-5">
              <h2 className="text-base font-semibold">{team.metadata.name}</h2>
              <p className="text-sm text-fg-secondary">{team.metadata.description}</p>
              {team.archivedAt ? (
                <span className="text-xs text-fg-tertiary">Archived</span>
              ) : (
                <Link
                  to="/org/$slug/settings/teams/$teamId"
                  params={{ slug: organization.slug, teamId: team.id }}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Open team
                </Link>
              )}
            </article>
          ))}
        </div>
        {query.data?.teams.length === 0 ? (
          <p className="text-sm text-fg-secondary">No teams yet.</p>
        ) : null}
      </QueryState>
      <Pagination cursor={cursor} nextCursor={query.data?.nextCursor} onChange={setCursor} />
      {creating ? <TeamDialog onClose={() => setCreating(false)} /> : null}
    </SettingsFrame>
  );
}
