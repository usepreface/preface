import * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { Input } from "@usepreface/ui/components/input";
import { SearchIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

import { Person } from "#/components/data-display/identity";
import { matches } from "#/components/data-display/table-toolbar";
import { FormDialog } from "#/components/feedback/form-dialog";
import { FormField } from "#/components/form/form-field";
import { SelectField } from "#/components/form/select-field";
import { SubmitButton } from "#/components/form/submit-button";
import { addTeamMembersForm } from "#/forms/teams";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { members, type Team } from "#/lib/placeholder";
import { roleIds, teamRoles } from "#/lib/roles";

const teamRoleChoices = teamRoles.map((role) => ({ value: role.id, label: role.name }));

/** Only people already in the organization can join a team. */
export function AddTeamMembersDialog({
  team,
  open,
  onOpenChange,
  preview,
}: {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview?: boolean;
}) {
  const [search, setSearch] = React.useState(preview ? "a" : "");
  const form = useSchemaForm(addTeamMembersForm, {
    defaultValues: {
      members: preview ? ["jon@acme.dev", "sara@acme.dev"] : [],
      roleId: roleIds(["Team member"])[0] ?? "",
    },
  });
  const count = form.watch("members").length;
  const candidates = members.filter(
    (member) => member.status === "active" && matches(search, member.name, member.email),
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Add members to ${team.name}`}
      description="Only people already in the organization can join a team."
      note={`${count} selected`}
      as={(content) => (
        <form
          noValidate
          className="contents"
          onSubmit={form.handleSubmit(({ members: added }) => {
            feedback.done(
              `${added.length === 1 ? "1 member" : `${added.length} members`} added to ${team.name}`,
            );
            onOpenChange(false);
            form.reset();
          })}
        >
          {content}
        </form>
      )}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <SubmitButton>{count > 1 ? `Add ${count} members` : "Add member"}</SubmitButton>
        </>
      }
    >
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-icon-secondary" />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search people in the organization"
          aria-label="Search people"
          className="pl-8"
          autoFocus
        />
      </div>
      <FormField
        control={form.control}
        name="members"
        label={<span className="sr-only">People</span>}
        className="gap-0"
      >
        {({ field, invalid, describedBy }) => {
          const selected: readonly string[] = field.value;
          return (
            <ul
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className="max-h-64 overflow-y-auto rounded-lg border"
            >
              {candidates.map((member) => {
                const already = team.members.includes(member.name);
                const checked = already || selected.includes(member.email);
                return (
                  <li key={member.email} className="border-b last:border-b-0">
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 px-3 py-2.5",
                        checked && !already ? "bg-selected" : "hover:bg-hover",
                        already ? "cursor-not-allowed" : null,
                      )}
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={checked}
                        disabled={already}
                        onChange={(event) =>
                          field.onChange(
                            event.target.checked
                              ? [...selected, member.email]
                              : selected.filter((email) => email !== member.email),
                          )
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <Person
                          name={member.name}
                          detail={member.email}
                          size="sm"
                          muted={already}
                        />
                      </span>
                      <span className="text-caption text-fg-tertiary">
                        {already ? `Already in ${team.name}` : (member.teams[0] ?? "No team")}
                      </span>
                    </label>
                  </li>
                );
              })}
              {candidates.length ? null : (
                <li className="px-3 py-6 text-center text-sm text-fg-tertiary">
                  Nobody matches “{search}”.
                </li>
              )}
            </ul>
          );
        }}
      </FormField>
      <SelectField
        control={form.control}
        name="roleId"
        label="Team role"
        options={teamRoleChoices}
      />
    </FormDialog>
  );
}
