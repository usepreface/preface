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
import { EditIcon, LockIcon } from "@usepreface/ui/icons";

import { PeopleStack } from "#/components/data-display/identity";
import { TableCard } from "#/components/data-display/table-card";
import { permissionCount } from "#/lib/permissions";
import type { Role } from "#/lib/placeholder";

/** Roles of one scope. Built-in roles open read-only, custom roles open for editing. */
export function RolesTable({
  roles,
  onOpen,
}: {
  roles: readonly Role[];
  onOpen: (role: Role) => void;
}) {
  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="max-md:hidden">Permissions</TableHead>
            <TableHead className="max-sm:hidden">Members</TableHead>
            <TableHead className="w-0">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => {
            const custom = role.kind === "custom";
            const total = permissionCount(role.scope);
            return (
              <TableRow key={role.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      {role.name}
                      {custom ? null : (
                        <LockIcon className="size-3 text-icon-secondary" aria-label="Built-in" />
                      )}
                    </span>
                    <span className="font-mono text-2xs text-fg-tertiary">{role.key}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {custom ? (
                    <Badge tone="teal">Custom</Badge>
                  ) : (
                    <Badge variant="outline">Built-in</Badge>
                  )}
                </TableCell>
                <TableCell className="text-fg-secondary max-md:hidden">
                  {role.permissions.length === total
                    ? `All ${total}`
                    : `${role.permissions.length} of ${total}`}
                </TableCell>
                <TableCell className="max-sm:hidden">
                  <PeopleStack
                    names={role.members}
                    more={role.members.length > 3 ? undefined : `${role.members.length}`}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onOpen(role)}>
                    {custom ? <EditIcon data-icon="inline-start" /> : null}
                    {custom ? "Edit" : "View"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableCard>
  );
}
