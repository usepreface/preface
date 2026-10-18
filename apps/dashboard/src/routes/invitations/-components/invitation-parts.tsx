import { Badge } from "@usepreface/ui/components/badge";

import { DetailList } from "#/components/data-display/detail-list";
import { Person, PeopleStack, RoleBadge, TeamBadge } from "#/components/data-display/identity";
import { OrgAvatar } from "#/components/organization/org-avatar";
import { invitation, members } from "#/lib/placeholder";
import { isCustomRole } from "#/lib/roles";
import { organizationUrl } from "#/lib/urls";

/** The organization being joined, with its size. The aside of the invitation screen. */
export function InvitationOrgCard() {
  const { organization, stats } = invitation;
  const names = members.slice(0, 5).map((member) => member.name);
  return (
    <div className="flex w-100 flex-col items-center gap-4.5 rounded-[20px] border border-border-subtle bg-surface-1 p-7 text-center shadow-lg">
      <OrgAvatar name={organization.name} size="xl" />
      <div className="flex flex-col gap-1">
        <span className="text-heading-2 text-foreground">{organization.name}</span>
        <span className="font-mono text-mono-sm text-fg-tertiary">
          {organizationUrl(organization.slug)}
        </span>
      </div>
      <p className="max-w-80 text-sm text-fg-secondary">{organization.description}</p>
      <dl className="grid w-full grid-cols-3 divide-x overflow-hidden rounded-xl border">
        {Object.entries(stats).map(([label, value]) => (
          <div key={label} className="flex flex-col-reverse items-center gap-0.5 py-2.5">
            <dt className="text-caption text-fg-tertiary">{label}</dt>
            <dd className="text-heading-3 text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <PeopleStack
        names={names}
        max={5}
        more={`${names[0]?.split(" ")[0]}, ${names[2]?.split(" ")[0]} and ${stats.members - 2} others`}
      />
    </div>
  );
}

/** Who invited whom, and the roles and teams that come with accepting. */
export function InvitationDetails() {
  return (
    <DetailList
      className="rounded-xl border px-3.5"
      labelWidth="w-32"
      items={[
        {
          label: "Invited by",
          value: (
            <Person
              name={invitation.invitedBy.name}
              detail={invitation.invitedBy.email}
              size="sm"
            />
          ),
        },
        { label: "Invited email", value: invitation.email },
        {
          label: "Organization roles",
          value: (
            <span className="flex flex-wrap gap-1.5">
              {invitation.roles.map((role) => (
                <RoleBadge key={role} role={role} custom={isCustomRole(role)} />
              ))}
            </span>
          ),
        },
        {
          label: "Teams",
          value: (
            <span className="flex flex-col gap-1">
              {invitation.teams.map((team) => (
                <span key={team.name} className="flex items-center gap-1.5">
                  <TeamBadge team={team.name} />
                  <span className="text-caption font-normal text-fg-secondary">{team.role}</span>
                </span>
              ))}
            </span>
          ),
        },
      ]}
    />
  );
}

/** The organization row on the invitation problem screens. */
export function InvitationOrgRow({ status }: { status: "Expired" | "Revoked" }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border bg-surface-2 px-3.5 py-3 text-left">
      <OrgAvatar name={invitation.organization.name} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold text-foreground">
          {invitation.organization.name}
        </span>
        <span className="truncate text-caption text-fg-tertiary">
          Invited by {invitation.invitedBy.name} · {invitation.email}
        </span>
      </span>
      <Badge tone={status === "Expired" ? "warning" : "danger"}>{status}</Badge>
    </div>
  );
}
