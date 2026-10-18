import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import type { OrganizationRoleId, RoleScope } from "@usepreface/protocol";
import type { PublicOrganizationRole } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";
import { TrashIcon } from "@usepreface/ui/icons";

import { Pagination } from "#/components/api/pagination";
import { Permission } from "#/components/api/permission";
import { QueryState } from "#/components/api/query-state";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { PageTitle } from "#/components/shell/page";
import { useRoles, useOrganizationRolesArchive } from "#/hooks/membership";
import { useOrganization } from "#/hooks/organizations";

import { RoleSheet } from "./-components/role-sheet";
import { SettingsFrame } from "./-components/settings-frame";

export const Route = createFileRoute("/org/$slug/_app/settings/roles")({
  component: () => (
    <Permission permission="roles.read">
      <Roles />
    </Permission>
  ),
});
function Roles() {
  const { organization, access } = useOrganization();
  const [cursor, setCursor] = useState<OrganizationRoleId>();
  const [scope, setScope] = useState<RoleScope>("organization");
  const query = useRoles(organization.id, cursor, scope);
  const archive = useOrganizationRolesArchive();
  const [editing, setEditing] = useState<PublicOrganizationRole | null>();
  const [archiving, setArchiving] = useState<PublicOrganizationRole>();
  return (
    <SettingsFrame
      crumbs={[{ label: "Roles" }]}
      actions={
        access.permissions.includes("roles.manage") ? (
          <Button onClick={() => setEditing(null)}>Create role</Button>
        ) : null
      }
    >
      <PageTitle
        title="Roles"
        description="Organization and team permissions. Assign roles from member or team pages."
      />
      <div className="flex gap-3">
        <Button
          variant={scope === "organization" ? "default" : "outline"}
          onClick={() => {
            setScope("organization");
            setCursor(undefined);
          }}
        >
          Organization roles
        </Button>
        <Button
          variant={scope === "team" ? "default" : "outline"}
          onClick={() => {
            setScope("team");
            setCursor(undefined);
          }}
        >
          Team roles
        </Button>
      </div>
      <QueryState query={query}>
        <div className="flex flex-col gap-3">
          {query.data?.roles.map((role) => (
            <article
              key={role.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border p-4"
            >
              <div className="flex-1">
                <h2 className="text-sm font-semibold">{role.name}</h2>
                <p className="text-xs text-fg-tertiary">
                  {role.scopeKind} · {role.kind} · {role.permissions.length} permissions
                  {role.archivedAt ? " · Archived" : ""}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(role)}>
                View role
              </Button>
              {role.kind === "custom" &&
              !role.archivedAt &&
              access.permissions.includes("roles.manage") &&
              (role.scopeKind === "team"
                ? access.permissions.includes("teams.manage")
                : role.permissions.every((permission) =>
                    new Set<string>(access.permissions).has(permission),
                  )) ? (
                <Button size="sm" variant="ghost" onClick={() => setArchiving(role)}>
                  Archive
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      </QueryState>
      <Pagination cursor={cursor} nextCursor={query.data?.nextCursor} onChange={setCursor} />
      {editing !== undefined ? (
        <RoleSheet role={editing ?? undefined} onClose={() => setEditing(undefined)} />
      ) : null}
      <ConfirmDialog
        open={Boolean(archiving)}
        onOpenChange={(open) => {
          if (!open) setArchiving(undefined);
        }}
        pending={archive.pending}
        icon={TrashIcon}
        title="Archive role?"
        description="This revokes all current assignments of this role."
        confirmLabel="Archive role"
        onConfirm={async () => {
          if (
            archiving &&
            (await archive.run({
              params: { organizationId: organization.id, roleId: archiving.id },
            }))
          )
            setArchiving(undefined);
        }}
      />
    </SettingsFrame>
  );
}
