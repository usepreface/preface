import * as React from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { Button, buttonVariants } from "@usepreface/ui/components/button";
import { HomeIcon, MailIcon, PlusIcon } from "@usepreface/ui/icons";

import { AccessDenied } from "#/components/feedback/access-denied";
import { PageSection, PageTitle } from "#/components/shell/page";
import { feedback } from "#/lib/feedback";
import { organizationBySlug, type Role } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";
import { organizationRoles, roleByName, teamRoles } from "#/lib/roles";

import { RoleAssignments } from "./-components/role-assignments";
import { RoleSheet } from "./-components/role-sheet";
import { RolesTable } from "./-components/roles-table";
import { SettingsFrame } from "./-components/settings-frame";
export const Route = createFileRoute("/org/$slug/_app/settings/roles")({
  head: () => ({ meta: [{ title: "Roles · Settings · Preface" }] }),
  validateSearch: previewSearch,
  component: RolesSettings,
});

/*
 * Roles and permissions. `?state=create` opens a new custom role, `?state=assignments` shows
 * one custom role's members, and `?state=no-access` what people without "View roles" see.
 */
function RolesSettings() {
  const state = previewState(["create", "assignments", "no-access"], Route.useSearch().state);
  const [sheet, setSheet] = React.useState<{ role?: Role } | null>(state === "create" ? {} : null);

  if (state === "no-access") return <NoAccess />;
  const supportLead = roleByName("Support lead");
  if (state === "assignments" && supportLead) return <RoleAssignments role={supportLead} />;

  return (
    <SettingsFrame
      crumbs={[{ label: "Roles" }]}
      width="full"
      actions={
        <Button onClick={() => setSheet({})}>
          <PlusIcon data-icon="inline-start" />
          Create role
        </Button>
      }
    >
      <PageTitle
        title="Roles and permissions"
        description="Built-in roles are read-only. Create custom roles to grant exactly what a job needs."
      />
      <PageSection title="Organization roles">
        <RolesTable roles={organizationRoles} onOpen={(role) => setSheet({ role })} />
      </PageSection>
      <PageSection title="Team roles">
        <RolesTable roles={teamRoles} onOpen={(role) => setSheet({ role })} />
      </PageSection>
      {sheet ? (
        <RoleSheet
          key={sheet.role?.id ?? "new"}
          role={sheet.role}
          open
          onOpenChange={() => setSheet(null)}
        />
      ) : null}
    </SettingsFrame>
  );
}

function NoAccess() {
  const { slug } = Route.useParams();
  const organization = organizationBySlug(slug);
  return (
    <SettingsFrame crumbs={[{ label: "Roles" }]}>
      <AccessDenied
        title="You don’t have access to this page"
        description={`Roles and permissions are managed by owners and admins of ${organization.name}. Your role is Member · Support lead.`}
        actions={
          <>
            <Link to="/org/$slug" params={{ slug }} className={buttonVariants()}>
              <HomeIcon data-icon="inline-start" />
              Back to {organization.name}
            </Link>
            <Button variant="outline" onClick={feedback.notConnected}>
              <MailIcon data-icon="inline-start" />
              Ask an admin
            </Button>
          </>
        }
      />
    </SettingsFrame>
  );
}
