import * as React from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Counter } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";
import { InfoIcon, PlusIcon, TrashIcon } from "@usepreface/ui/icons";

import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { Notice } from "#/components/feedback/notice";
import { PageTitle } from "#/components/shell/page";
import { feedback } from "#/lib/feedback";
import { invitations, members, organizationBySlug, type Member } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

import { InviteMembersDialog } from "./-components/invite-members-dialog";
import { MemberRolesDialog } from "./-components/member-roles-dialog";
import { InvitationsTab, MembersTab } from "./-components/member-tabs";
import { type MemberAction } from "./-components/members-table";
import { SettingsFrame } from "./-components/settings-frame";
import { SuspendDialog } from "./-components/suspend-dialog";
export const Route = createFileRoute("/org/$slug/_app/settings/members")({
  head: () => ({ meta: [{ title: "Members · Settings · Preface" }] }),
  validateSearch: previewSearch,
  component: MembersSettings,
});

const states = [
  "invite",
  "roles",
  "suspend",
  "read-only",
  "loading",
  "invitations",
  "no-invitations",
] as const;

/*
 * Members and invitations. `?state=` previews the invite dialog, managing roles, suspending,
 * the read-only view for people without "Manage members", loading, and the invitations tab
 * (`invitations`, `no-invitations`).
 */
function MembersSettings() {
  const { slug } = Route.useParams();
  const state = previewState(states, Route.useSearch().state);
  const organization = organizationBySlug(slug);
  const readOnly = state === "read-only";
  const [inviting, setInviting] = React.useState(state === "invite");
  const [action, setAction] = React.useState<{ member: Member; action: MemberAction } | null>(
    () => {
      const preview =
        state === "roles" ? "Marco Rossi" : state === "suspend" ? "Jon Smith" : undefined;
      const member = members.find((candidate) => candidate.name === preview);
      return member && (state === "roles" || state === "suspend")
        ? { member, action: state }
        : null;
    },
  );
  const pending = state === "no-invitations" ? [] : invitations;

  return (
    <SettingsFrame
      crumbs={[{ label: "Members" }]}
      width="full"
      actions={
        readOnly ? null : (
          <Button onClick={() => setInviting(true)}>
            <PlusIcon data-icon="inline-start" />
            Invite members
          </Button>
        )
      }
    >
      <PageTitle
        title="Members"
        description={`Everyone in ${organization.name}, their organization roles and the teams they belong to.`}
      />
      <Tabs
        defaultValue={
          state === "invitations" || state === "no-invitations" ? "invitations" : "members"
        }
      >
        <TabsList variant="line">
          <TabsTrigger value="members">
            Members <Counter>{members.length}</Counter>
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations{" "}
            <Counter>
              {pending.filter((invitation) => invitation.status === "pending").length}
            </Counter>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="flex flex-col gap-4 pt-4">
          {readOnly ? (
            <Notice tone="info" icon={InfoIcon} title="You can view members but not change them">
              Managing members needs the “Manage members” permission. Ask an owner or admin of{" "}
              {organization.name}.
            </Notice>
          ) : null}
          <MembersTab
            loading={state === "loading"}
            selected={action?.member.name}
            onAction={readOnly ? undefined : (member, next) => setAction({ member, action: next })}
          />
        </TabsContent>
        <TabsContent value="invitations" className="flex flex-col gap-4 pt-4">
          <InvitationsTab invitations={pending} onInvite={() => setInviting(true)} />
        </TabsContent>
      </Tabs>
      <InviteMembersDialog
        open={inviting}
        onOpenChange={setInviting}
        preview={state === "invite"}
      />
      {action?.action === "roles" ? (
        <MemberRolesDialog member={action.member} onOpenChange={() => setAction(null)} />
      ) : null}
      {action?.action === "suspend" ? (
        <SuspendDialog member={action.member} onClose={() => setAction(null)} />
      ) : null}
      <ConfirmDialog
        open={action?.action === "remove"}
        onOpenChange={() => setAction(null)}
        icon={TrashIcon}
        title={`Remove ${action?.member.name ?? "member"}?`}
        description={`They lose access to ${organization.name} right away and leave every team. Their conversations stay. To come back, they need a new invitation.`}
        confirmLabel="Remove member"
        onConfirm={() => feedback.done("Member removed", action?.member.email)}
      />
    </SettingsFrame>
  );
}
