import * as React from "react";

import { useParams } from "@tanstack/react-router";

import { Badge, Counter } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { Input } from "@usepreface/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";
import { EditIcon, PackageIcon, SearchIcon } from "@usepreface/ui/icons";
import { InlineCode } from "@usepreface/ui/preface/data-display";

import { Person, RoleBadge } from "#/components/data-display/identity";
import { TableCard } from "#/components/data-display/table-card";
import { Notice } from "#/components/feedback/notice";
import { PageTitle } from "#/components/shell/page";
import { feedback } from "#/lib/feedback";
import { permissionGroupsFor } from "#/lib/permissions";
import { members, type Role } from "#/lib/placeholder";

import { RoleSheet } from "./role-sheet";
import { SettingsFrame } from "./settings-frame";

export function RoleAssignments({ role }: { role: Role }) {
  const { slug } = useParams({ from: "/org/$slug/_app" });
  const [editing, setEditing] = React.useState(false);
  const holders = members.filter((member) => role.members.includes(member.name));

  return (
    <SettingsFrame
      crumbs={[
        { label: "Roles", link: { to: "/org/$slug/settings/roles", params: { slug } } },
        { label: role.name },
      ]}
      width="full"
      actions={
        <>
          <Button variant="outline" onClick={feedback.notConnected}>
            <PackageIcon data-icon="inline-start" />
            Archive role
          </Button>
          <Button onClick={() => setEditing(true)}>
            <EditIcon data-icon="inline-start" />
            Edit permissions
          </Button>
        </>
      }
    >
      <PageTitle
        title={role.name}
        badges={
          <>
            <Badge tone="teal">Custom</Badge>
            <Badge variant="outline">{role.scope === "team" ? "Team" : "Organization"}</Badge>
            <InlineCode>{role.key}</InlineCode>
          </>
        }
        description={role.description}
      />
      <Tabs defaultValue="members">
        <TabsList variant="line">
          <TabsTrigger value="members">
            Members <Counter>{holders.length}</Counter>
          </TabsTrigger>
          <TabsTrigger value="permissions">
            Permissions <Counter>{role.permissions.length}</Counter>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="flex flex-col gap-4 pt-4">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              feedback.notConnected();
            }}
          >
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-icon-secondary" />
              <Input
                placeholder="Add people by name or email…"
                aria-label="Add people"
                className="pl-8"
              />
            </div>
            <Button type="submit" variant="secondary">
              Assign
            </Button>
          </form>
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Other roles</TableHead>
                  <TableHead className="max-md:hidden">Assigned</TableHead>
                  <TableHead className="w-0">
                    <span className="sr-only">Remove</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holders.map((member, index) => (
                  <TableRow key={member.email}>
                    <TableCell>
                      <Person name={member.name} detail={member.email} />
                    </TableCell>
                    <TableCell>
                      <span className="flex gap-1">
                        {member.roles
                          .filter((name) => name !== role.name)
                          .map((name) => (
                            <RoleBadge key={name} role={name} />
                          ))}
                      </span>
                    </TableCell>
                    <TableCell className="text-fg-secondary max-md:hidden">
                      Oct {11 + index * 2} by {index === 2 ? "Jon Smith" : "Aisha Khan"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => feedback.done(`${role.name} removed from ${member.name}`)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
          <Notice tone="neutral">
            Archiving removes this role from {holders.length} members. Their other roles stay, and
            the role can be restored with its permissions.
          </Notice>
        </TabsContent>
        <TabsContent value="permissions" className="pt-4 lg:max-w-200">
          <ReadOnlyPermissions role={role} />
        </TabsContent>
      </Tabs>
      <RoleSheet role={role} open={editing} onOpenChange={setEditing} />
    </SettingsFrame>
  );
}

/** What the role grants, granted permissions highlighted. */
function ReadOnlyPermissions({ role }: { role: Role }) {
  const groups = permissionGroupsFor(role.scope);
  const granted: ReadonlySet<string> = new Set(role.permissions);
  return (
    <ul className="flex flex-col gap-2">
      {groups.map((group) => (
        <li key={group.title} className="flex flex-col gap-1.5 rounded-lg border px-3.5 py-3">
          <span className="text-sm font-medium text-foreground">{group.title}</span>
          <span className="flex flex-wrap gap-1.5">
            {group.permissions.map((permission) => (
              <Badge
                key={permission.id}
                tone={granted.has(permission.id) ? "success" : "neutral"}
                variant={granted.has(permission.id) ? "subtle" : "outline"}
              >
                {permission.label}
              </Badge>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}
