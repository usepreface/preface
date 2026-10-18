import * as React from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { Button, buttonVariants } from "@usepreface/ui/components/button";
import { Spinner } from "@usepreface/ui/components/spinner";
import { LockIcon, LogoutIcon, MailIcon, PlusIcon, RefreshIcon } from "@usepreface/ui/icons";
import { NoOrganizationsIllustration } from "@usepreface/ui/illustrations";

import { DetailList } from "#/components/data-display/detail-list";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { EmptyState } from "#/components/feedback/empty-state";
import { Notice } from "#/components/feedback/notice";
import { AppTopBar } from "#/components/shell/app-top-bar";
import { me } from "#/components/shell/me";
import { PageContent, PageTitle } from "#/components/shell/page";
import { ShellLayout } from "#/components/shell/shell-layout";
import { feedback } from "#/lib/feedback";
import {
  organizations,
  pendingInvitation,
  placeholder,
  type OrganizationSummary,
} from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";
import { organizationUrl } from "#/lib/urls";

import { OrganizationCard, OrganizationCardSkeleton } from "./-components/organization-card";

export const Route = createFileRoute("/organizations/")({
  head: () => ({ meta: [{ title: `Organizations · ${placeholder.instance.name}` }] }),
  validateSearch: previewSearch,
  component: Organizations,
});

/*
 * The organization picker, after sign-in and from the top bar. `?state=sso` opens the SSO
 * prompt, `?state=empty` shows someone with no organizations and `?state=loading` the skeleton.
 */
function Organizations() {
  const state = previewState(["sso", "empty", "loading"], Route.useSearch().state);
  const [ssoFor, setSsoFor] = React.useState<OrganizationSummary | undefined>(
    state === "sso"
      ? organizations.find((organization) => organization.access === "sso")
      : undefined,
  );

  return (
    <ShellLayout
      topBar={(props) => (
        <AppTopBar
          {...props}
          workspace={null}
          person={me}
          instanceOwner={me.instanceOwner}
          search={false}
        />
      )}
    >
      <PageContent width="md" className="gap-6 py-10 sm:py-12">
        {state === "empty" ? (
          <NoOrganizations />
        ) : (
          <>
            <PageTitle
              title="Choose an organization"
              description={`Signed in as ${me.email}. Pick where you want to work.`}
              actions={
                state === "loading" || !me.instanceOwner ? null : (
                  <Link to="/organizations/new" className={buttonVariants()}>
                    <PlusIcon data-icon="inline-start" />
                    New organization
                  </Link>
                )
              }
            />
            {state === "loading" ? (
              <>
                <div className="grid gap-5 md:grid-cols-2" aria-busy="true">
                  {Array.from({ length: 4 }, (_, index) => (
                    <OrganizationCardSkeleton key={index} />
                  ))}
                </div>
                <p role="status" className="flex items-center gap-2 text-sm text-fg-tertiary">
                  <Spinner className="size-4" />
                  Loading your organizations…
                </p>
              </>
            ) : (
              <>
                <PendingInvitation />
                <div className="grid gap-5 md:grid-cols-2">
                  {organizations.map((organization, index) => (
                    <OrganizationCard
                      key={organization.slug}
                      organization={organization}
                      primary={index === 0}
                      onRequireSso={() => setSsoFor(organization)}
                    />
                  ))}
                </div>
                <p className="text-caption text-fg-tertiary">
                  Organizations that require SSO open after you sign in with their identity
                  provider. You’ll land on the page you asked for.
                </p>
              </>
            )}
          </>
        )}
      </PageContent>
      {ssoFor ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (open ? null : setSsoFor(undefined))}
          icon={LockIcon}
          tone="accent"
          destructive={false}
          title={`${ssoFor.name} requires Okta`}
          description={`Sign in with Okta to open ${ssoFor.name}. When you’re done you’ll come back to its home page.`}
          confirmLabel="Continue with Okta"
          onConfirm={feedback.notConnected}
        >
          <DetailList
            className="rounded-xl border px-3.5"
            labelWidth="w-32"
            items={[
              { label: "Organization", value: ssoFor.name },
              { label: "Identity provider", value: "Okta · globex.okta.com" },
              { label: "Then open", value: organizationUrl(ssoFor.slug), mono: true },
            ]}
          />
        </ConfirmDialog>
      ) : null}
    </ShellLayout>
  );
}

function PendingInvitation() {
  const invite = pendingInvitation;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-focus bg-primary-subtle px-4 py-3">
      <MailIcon className="size-4.5 shrink-0 text-icon-accent" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-foreground">
          {invite.organization} invited you
        </span>
        <span className="text-caption text-fg-secondary">
          Sent by {invite.invitedBy} · {invite.role} · expires {invite.expires}
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={feedback.notConnected}>
        Decline
      </Button>
      <Link to="/invitations/accept" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Review invitation
      </Link>
    </div>
  );
}

function NoOrganizations() {
  const email = "lena@contractor.io";
  return (
    <div className="flex flex-col items-center gap-5 py-10">
      <EmptyState
        art={<NoOrganizationsIllustration />}
        title="You’re not in any organizations yet"
        description={`Organizations on ${placeholder.instance.name} are invitation-only. Ask an admin to invite ${email}, then open the link in the email.`}
        actions={
          <>
            <Button variant="outline" onClick={feedback.notConnected}>
              <RefreshIcon data-icon="inline-start" />
              Check again
            </Button>
            <Link to="/sign-in" className={buttonVariants({ variant: "ghost" })}>
              <LogoutIcon data-icon="inline-start" />
              Sign out
            </Link>
          </>
        }
      />
      <Notice tone="neutral" className="max-w-130">
        Signed in as {email}. Only instance owners can create organizations.
      </Notice>
    </div>
  );
}
