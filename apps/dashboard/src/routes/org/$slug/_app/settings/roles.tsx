import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import type { PublicOrganizationRole } from "@usepreface/protocol/dto";
import { Badge } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import { PlusIcon, LockIcon, TrashIcon } from "@usepreface/ui/icons";

import { Permission } from "#/components/api/permission";
import { QueryState } from "#/components/api/query-state";
import { TableCard } from "#/components/data-display/table-card";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { PageTitle, PageSection } from "#/components/shell/page";
import { useAllRoles, useOrganizationRolesArchive } from "#/hooks/membership";
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
  const query = useAllRoles(organization.id);
  const archive = useOrganizationRolesArchive();
  const [editing, setEditing] = useState<PublicOrganizationRole | null>();
  const [archiving, setArchiving] = useState<PublicOrganizationRole>();
  return (
    <SettingsFrame
      crumbs={[{ label: "Roles" }]}
      width="full"
      actions={
        access.permissions.includes("roles.manage") ? (
          <Button onClick={() => setEditing(null)}>
            <PlusIcon data-icon="inline-start" />
            Create role
          </Button>
        ) : null
      }
    >
      <PageTitle
        title="Roles and permissions"
        description="Built-in roles are read-only. Create custom roles to grant exactly what a job needs."
      />
      <QueryState query={query}>
        {(["organization", "team"] as const).map((scope) => (
          <PageSection
            key={scope}
            title={scope === "organization" ? "Organization roles" : "Team roles"}
          >
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="max-md:hidden">Permissions</TableHead>
                    <TableHead className="w-0">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data
                    ?.filter((role) => role.scopeKind === scope)
                    .map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <h2 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                              {role.name}
                              {role.kind === "builtin" ? (
                                <LockIcon
                                  className="size-3 text-icon-secondary"
                                  aria-label="Built-in"
                                />
                              ) : null}
                            </h2>
                            <span className="font-mono text-2xs text-fg-tertiary">{role.key}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={role.kind === "builtin" ? "outline" : "subtle"}
                            tone={role.kind === "custom" ? "teal" : "neutral"}
                          >
                            {role.archivedAt
                              ? "Archived"
                              : role.kind === "custom"
                                ? "Custom"
                                : "Built-in"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-fg-secondary max-md:hidden">
                          {role.permissions.length} permissions
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditing(role)}>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableCard>
          </PageSection>
        ))}
      </QueryState>
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
