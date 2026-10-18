import { createFileRoute, Link } from "@tanstack/react-router";

import { buttonVariants } from "@usepreface/ui/components/button";

import { Notice } from "#/components/feedback/notice";
import { PageBar, PageContent, PageTitle, PageSection } from "#/components/shell/page";
import { useOrganization } from "#/hooks/organizations";
import { usePerson } from "#/hooks/session";
export const Route = createFileRoute("/org/$slug/_app/")({ component: OrganizationHome });
function OrganizationHome() {
  const { organization, access } = useOrganization();
  const person = usePerson();
  return (
    <>
      <PageBar crumbs={[{ label: "Home" }]} />
      <PageContent>
        <PageTitle
          title={`Welcome to ${organization.metadata.name}, ${person.name.split(" ")[0]}`}
          description={organization.metadata.description}
        />
        {organization.archivedAt ? (
          <Notice tone="warning">This organization is archived.</Notice>
        ) : null}
        <PageSection
          title="Your organization"
          description="Manage people, teams and sign-in methods."
        >
          <div className="flex flex-wrap gap-3">
            {access.permissions.includes("members.read") ? (
              <Link
                to="/org/$slug/settings/members"
                params={{ slug: organization.slug }}
                className={buttonVariants({ variant: "outline" })}
              >
                Members and invitations
              </Link>
            ) : null}
            {access.permissions.includes("teams.read") ? (
              <Link
                to="/org/$slug/settings/teams"
                params={{ slug: organization.slug }}
                className={buttonVariants({ variant: "outline" })}
              >
                Teams
              </Link>
            ) : null}
            {access.isOwner ? (
              <Link
                to="/org/$slug/settings/authentication"
                params={{ slug: organization.slug }}
                className={buttonVariants({ variant: "outline" })}
              >
                Authentication
              </Link>
            ) : null}
          </div>
        </PageSection>
        <Notice tone="neutral">Knowledge sources and AI features are not available yet.</Notice>
      </PageContent>
    </>
  );
}
