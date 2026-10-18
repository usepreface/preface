import { Button } from "@usepreface/ui/components/button";

import { QueryState } from "#/components/api/query-state";
import { Person, RoleBadge } from "#/components/data-display/identity";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { quickInviteForm } from "#/forms/invitation";
import { useAllRoles, useOrganizationInvitationsCreate } from "#/hooks/membership";
import { useOrganization } from "#/hooks/organizations";
import { usePerson } from "#/hooks/session";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

import { HomeCard } from "./home-parts";

export function InviteCard({ onChooseRoles }: { onChooseRoles: () => void }) {
  const { organization, access } = useOrganization();
  const person = usePerson();
  const roles = useAllRoles(organization.id);
  const invite = useOrganizationInvitationsCreate();
  const form = useSchemaForm(quickInviteForm, { defaultValues: { email: "" } });
  const memberRole = roles.data?.find(
    (role) =>
      role.scopeKind === "organization" &&
      role.kind === "builtin" &&
      role.key === "member" &&
      !role.archivedAt &&
      role.permissions.every(
        (permission) => access.isOwner || new Set<string>(access.permissions).has(permission),
      ),
  );

  return (
    <HomeCard title="Invite your team" className="lg:w-90">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <Person name={person.name} detail={person.email} />
          </div>
          {access.isOwner ? <RoleBadge role="Owner" /> : null}
        </div>
        <QueryState query={roles}>
          {memberRole ? (
            <form
              noValidate
              className="flex items-start gap-2"
              onSubmit={form.handleSubmit(async ({ email }) => {
                if (
                  await invite.run({
                    params: { organizationId: organization.id },
                    payload: { email, roleIds: [memberRole.id], teams: [] },
                  })
                ) {
                  feedback.done("Invitation queued", "They’ll join with the Member role.");
                  form.reset();
                }
              })}
            >
              <TextField
                control={form.control}
                name="email"
                label={<span className="sr-only">Email to invite</span>}
                className="min-w-0 flex-1 gap-0"
                inputProps={{ type: "email", placeholder: "name@company.com" }}
              />
              <SubmitButton variant="secondary" pending={invite.pending}>
                Invite
              </SubmitButton>
            </form>
          ) : (
            <Button variant="secondary" onClick={onChooseRoles}>
              Invite members
            </Button>
          )}
        </QueryState>
      </div>
    </HomeCard>
  );
}
