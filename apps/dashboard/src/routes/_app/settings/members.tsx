import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";
import { PlusIcon } from "@usepreface/ui/icons";

import { Permission } from "#/components/api/permission";
import { PageTitle } from "#/components/shell/page";
import { useOrganization } from "#/hooks/organizations";

import { InvitationDirectory } from "./-components/invitation-directory";
import { InviteMembersDialog } from "./-components/invite-members-dialog";
import { MemberDirectory } from "./-components/member-directory";
import { SettingsFrame } from "./-components/settings-frame";

export const Route = createFileRoute("/_app/settings/members")({
  component: () => (
    <Permission permission="members.read">
      <MembersSettings />
    </Permission>
  ),
});
function MembersSettings() {
  const { access, organization } = useOrganization();
  const [inviting, setInviting] = useState(false);
  const canInvite =
    access.permissions.includes("members.manage") &&
    access.permissions.includes("roles.assign") &&
    access.permissions.includes("roles.read");
  return (
    <SettingsFrame
      crumbs={[{ label: "Members" }]}
      width="full"
      actions={
        canInvite ? (
          <Button onClick={() => setInviting(true)}>
            <PlusIcon data-icon="inline-start" />
            Invite members
          </Button>
        ) : null
      }
    >
      <PageTitle
        title="Members"
        description={`Everyone in ${
          organization.metadata.name
        }, their organization roles and membership status.`}
      />
      <Tabs defaultValue="members">
        <TabsList variant="line">
          <TabsTrigger value="members">Members</TabsTrigger>
          {access.permissions.includes("members.manage") ? (
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="members" className="pt-4">
          <MemberDirectory />
        </TabsContent>
        {access.permissions.includes("members.manage") ? (
          <TabsContent value="invitations" className="pt-4">
            <InvitationDirectory />
          </TabsContent>
        ) : null}
      </Tabs>
      {inviting && canInvite ? <InviteMembersDialog open onOpenChange={setInviting} /> : null}
    </SettingsFrame>
  );
}
