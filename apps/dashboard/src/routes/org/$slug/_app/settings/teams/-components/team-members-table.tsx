import { Button } from "@usepreface/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@usepreface/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import { CloseIcon } from "@usepreface/ui/icons";

import { Person, RoleBadge } from "#/components/data-display/identity";
import { TableCard } from "#/components/data-display/table-card";
import { feedback } from "#/lib/feedback";
import { teamMembers } from "#/lib/placeholder";
import { teamRoles } from "#/lib/roles";

const teamRoleItems = teamRoles.map((role) => ({ value: role.name, label: role.name }));

export function TeamMembersTable() {
  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Team role</TableHead>
            <TableHead className="max-md:hidden">Organization role</TableHead>
            <TableHead className="max-lg:hidden">Added</TableHead>
            <TableHead className="w-0">
              <span className="sr-only">Remove</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map((member) => (
            <TableRow key={member.email}>
              <TableCell>
                <Person name={member.name} detail={member.email} />
              </TableCell>
              <TableCell>
                <Select
                  items={teamRoleItems}
                  defaultValue={member.teamRole}
                  onValueChange={(role) =>
                    feedback.done("Team role updated", `${member.name} is now ${String(role)}.`)
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="w-40"
                    aria-label={`Team role for ${member.name}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teamRoleItems.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="max-md:hidden">
                <RoleBadge role={member.orgRole} />
              </TableCell>
              <TableCell className="text-fg-secondary max-lg:hidden">
                Added {member.added}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${member.name} from the team`}
                  onClick={() => feedback.done(`${member.name} removed from the team`)}
                >
                  <CloseIcon />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
