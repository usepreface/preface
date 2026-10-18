import * as React from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { LogoutIcon, UserCircleIcon } from "@usepreface/ui/icons";

import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { PageBar, PageContent, PageSection, PageTitle } from "#/components/shell/page";
import { feedback } from "#/lib/feedback";
import { sessions } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

import { ConnectedAccounts, Sessions } from "./-components/security-tables";
export const Route = createFileRoute("/account/security")({
  head: () => ({ meta: [{ title: "Accounts and sessions · Preface" }] }),
  validateSearch: previewSearch,
  component: Security,
});

/** Connected sign-in accounts and live sessions. `?state=confirm` opens "Sign out everywhere". */
function Security() {
  const [confirming, setConfirming] = React.useState(
    previewState(["confirm"], Route.useSearch().state) === "confirm",
  );

  return (
    <>
      <PageBar
        crumbs={[
          { label: "Account", icon: UserCircleIcon, link: { to: "/account/profile" } },
          { label: "Security" },
        ]}
      />
      <PageContent>
        <PageTitle
          title="Accounts and sessions"
          description="Where you can sign in from, and where you’re signed in right now."
          actions={
            <Button variant="destructive-outline" onClick={() => setConfirming(true)}>
              <LogoutIcon data-icon="inline-start" />
              Sign out everywhere
            </Button>
          }
        />
        <PageSection title="Connected accounts">
          <ConnectedAccounts />
        </PageSection>
        <PageSection title="Sessions">
          <Sessions />
        </PageSection>
      </PageContent>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        icon={LogoutIcon}
        title="Sign out everywhere?"
        description={`This ends all ${sessions.length} sessions, including this one. You’ll sign in again on every device, and the Preface CLI will ask for a new device code.`}
        confirmLabel="Sign out everywhere"
        onConfirm={feedback.notConnected}
      />
    </>
  );
}
