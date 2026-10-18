import * as React from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { LogoutIcon, PackageIcon, RefreshIcon } from "@usepreface/ui/icons";
import { SettingsCard } from "@usepreface/ui/preface/cards";

import { StatusBadge } from "#/components/data-display/status-badge";
import { ConfirmDialog, ConsequenceList } from "#/components/feedback/confirm-dialog";
import { Notice } from "#/components/feedback/notice";
import { PageTitle } from "#/components/shell/page";
import { feedback } from "#/lib/feedback";
import { organizationBySlug } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";
import { organizationStatus } from "#/lib/status";

import { OrganizationDetails } from "./-components/organization-details";
import { SettingsFrame } from "./-components/settings-frame";
export const Route = createFileRoute("/org/$slug/_app/settings/general")({
  head: () => ({ meta: [{ title: "General · Settings · Preface" }] }),
  validateSearch: previewSearch,
  component: GeneralSettings,
});

type Dialog = "archive" | "leave" | null;

/*
 * Name, URL and description, then leaving and archiving. `?state=archive` and `?state=leave`
 * open the confirmations; `?state=archived` shows the read-only organization.
 */
function GeneralSettings() {
  const { slug } = Route.useParams();
  const state = previewState(["archive", "archived", "leave"], Route.useSearch().state);
  const organization = organizationBySlug(slug);
  const archived = state === "archived" || organization.access === "archived";
  const [dialog, setDialog] = React.useState<Dialog>(
    state === "archive" || state === "leave" ? state : null,
  );

  return (
    <SettingsFrame crumbs={[{ label: "General" }]} width="md">
      <PageTitle
        title="General"
        description="Your organization’s name, URL and description."
        badges={archived ? <StatusBadge status={organizationStatus.archived} /> : null}
      />
      {archived ? (
        <Notice
          tone="warning"
          title={`${organization.name} is archived`}
          action={
            <Button variant="outline" size="sm" onClick={feedback.notConnected}>
              Restore
            </Button>
          }
        >
          Archived Oct 18 by Aisha Khan. Members can’t sign in, channels don’t answer and API keys
          are paused until an owner restores it.
        </Notice>
      ) : null}
      <OrganizationDetails archived={archived} />
      {archived ? (
        <SettingsCard
          title={<OwnerOnly>Restore organization</OwnerOnly>}
          description={`Bring ${organization.name} back exactly as it was. Members can sign in again and channels resume answering.`}
          action={
            <Button onClick={feedback.notConnected}>
              <RefreshIcon data-icon="inline-start" />
              Restore organization
            </Button>
          }
        />
      ) : (
        <>
          <SettingsCard
            title="Leave organization"
            description={`You’ll lose access to ${organization.name}’s sources, conversations and channels. Owners must transfer ownership before leaving.`}
            action={
              <Button variant="outline" onClick={() => setDialog("leave")}>
                <LogoutIcon data-icon="inline-start" />
                Leave organization
              </Button>
            }
          />
          <SettingsCard
            danger
            title={<OwnerOnly>Archive organization</OwnerOnly>}
            description={`Make ${organization.name} read-only: nobody can sign in, channels stop answering and API keys pause. Nothing is deleted, and you can restore it any time.`}
            action={
              <Button variant="destructive-outline" onClick={() => setDialog("archive")}>
                <PackageIcon data-icon="inline-start" />
                Archive organization
              </Button>
            }
          />
        </>
      )}
      <ConfirmDialog
        open={dialog === "archive"}
        onOpenChange={(open) => setDialog(open ? "archive" : null)}
        icon={PackageIcon}
        title={`Archive ${organization.name}?`}
        description={`Everything stays, but ${organization.name} becomes read-only until an owner restores it.`}
        confirmLabel="Archive organization"
        confirmText={slug}
        onConfirm={feedback.notConnected}
      >
        <ConsequenceList
          items={[
            {
              title: `${organization.members} members are signed out`,
              detail: "They’ll see “This organization is archived” if they sign in.",
            },
            {
              title: "4 channels stop answering",
              detail: "Docs widget, Slack bot, Discord bot and the public API.",
            },
            {
              title: "3 API keys pause",
              detail: `Requests return 403 until you restore ${organization.name}.`,
            },
          ]}
        />
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "leave"}
        onOpenChange={(open) => setDialog(open ? "leave" : null)}
        icon={LogoutIcon}
        tone="warning"
        title={`Leave ${organization.name}?`}
        description="You’ll lose access to its sources, conversations and channels right away. To come back, an admin has to invite you again."
        confirmLabel="Leave organization"
        onConfirm={feedback.notConnected}
      />
    </SettingsFrame>
  );
}

function OwnerOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      {children}
      <Badge variant="outline">Owner only</Badge>
    </span>
  );
}
