import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "@usepreface/ui/components/badge";
import { buttonVariants } from "@usepreface/ui/components/button";
import { BrainIcon, DatabaseIcon, HomeIcon, InfoIcon, UsersIcon } from "@usepreface/ui/icons";

import { Person, RoleBadge } from "#/components/data-display/identity";
import { Notice } from "#/components/feedback/notice";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { me } from "#/components/shell/me";
import { PageBar, PageContent } from "#/components/shell/page";
import { quickInviteForm } from "#/forms/invitation";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { organizationBySlug, teams } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

import {
  HomeCard,
  HomeCardEmpty,
  SetupProgress,
  SetupSteps,
  TeamRow,
} from "./-components/home-parts";

export const Route = createFileRoute("/org/$slug/_app/")({
  head: () => ({ meta: [{ title: "Home · Preface" }] }),
  validateSearch: previewSearch,
  component: OrganizationHome,
});

/** The organization home. Admins get the setup steps; `?state=member` shows what members see. */
function OrganizationHome() {
  const { slug } = Route.useParams();
  const member = previewState(["member"], Route.useSearch().state) === "member";
  const organization = organizationBySlug(slug);

  return (
    <>
      <PageBar
        crumbs={[{ label: "Home", icon: HomeIcon }]}
        actions={
          member ? null : (
            <Link to="/org/$slug/settings/members" params={{ slug }} className={buttonVariants()}>
              <UsersIcon data-icon="inline-start" />
              Invite members
            </Link>
          )
        }
      />
      <PageContent width="full" className="max-w-300">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="text-heading-2 text-foreground">
              Welcome to {organization.name}, {member ? "Marco" : me.name.split(" ")[0]}
            </h1>
            <p className="text-sm text-fg-secondary">
              {member
                ? "You joined as a Member of Support and Docs. Ask anything once your admins connect sources."
                : "Your organization is ready. Three steps to the first cited answer."}
            </p>
          </div>
          {member ? null : <SetupProgress done={0} total={3} />}
        </div>
        {member ? (
          <Notice
            tone="info"
            icon={InfoIcon}
            title={`${me.name} is still setting up ${organization.name}`}
          >
            Sources and the AI provider appear here once they’re connected. We’ll email you when{" "}
            {organization.name} can answer questions.
          </Notice>
        ) : (
          <SetupSteps />
        )}
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <HomeCard title="Sources" meta={<Badge>0</Badge>} className="min-h-55">
            <HomeCardEmpty
              icon={DatabaseIcon}
              title="No sources yet"
              description={
                member
                  ? `Only admins can connect sources. Ask ${me.name.split(" ")[0]} if you need one added.`
                  : "Connected sources and their sync status will show up here."
              }
            />
          </HomeCard>
          <div className="flex flex-col gap-4 lg:w-90 xl:flex-row xl:w-auto">
            {member ? (
              <>
                <HomeCard title="AI provider" className="xl:w-75">
                  <HomeCardEmpty icon={BrainIcon} title="Not configured" />
                </HomeCard>
                <HomeCard
                  title="Your teams"
                  meta={<span className="text-caption text-fg-tertiary">2 teams</span>}
                  className="xl:w-90"
                >
                  <div className="flex flex-col gap-3 p-4">
                    {teams
                      .filter((team) => team.slug === "support" || team.slug === "docs")
                      .map((team) => (
                        <TeamRow
                          key={team.slug}
                          name={team.name}
                          detail={`Team member · ${team.members.length} people`}
                        />
                      ))}
                  </div>
                </HomeCard>
              </>
            ) : (
              <InviteCard />
            )}
          </div>
        </div>
      </PageContent>
    </>
  );
}

function InviteCard() {
  const form = useSchemaForm(quickInviteForm, { defaultValues: { email: "" } });
  return (
    <HomeCard
      title="Invite your team"
      meta={<span className="text-caption text-fg-tertiary">1 member</span>}
      className="lg:w-90"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <Person name={me.name} detail={me.email} />
          </div>
          <RoleBadge role="Owner" />
        </div>
        <form
          noValidate
          className="flex items-start gap-2"
          onSubmit={form.handleSubmit(({ email }) => {
            feedback.sent("Invitation sent", `${email} joins as a Member.`);
            form.reset();
          })}
        >
          <TextField
            control={form.control}
            name="email"
            label={<span className="sr-only">Email to invite</span>}
            className="min-w-0 flex-1 gap-0"
            inputProps={{ type: "email", placeholder: "name@acme.dev" }}
          />
          <SubmitButton variant="secondary">Invite</SubmitButton>
        </form>
      </div>
    </HomeCard>
  );
}
