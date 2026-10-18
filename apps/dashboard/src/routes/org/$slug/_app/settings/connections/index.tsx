import * as React from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { Button, buttonVariants } from "@usepreface/ui/components/button";
import { ArrowRightIcon, BookIcon, PlusIcon } from "@usepreface/ui/icons";
import { SSOConnectedIllustration } from "@usepreface/ui/illustrations";

import { EmptyState } from "#/components/feedback/empty-state";
import { Notice } from "#/components/feedback/notice";
import { PageTitle } from "#/components/shell/page";
import { feedback } from "#/lib/feedback";
import { previewSearch, previewState } from "#/lib/preview";

import { SettingsFrame } from "../-components/settings-frame";
import { AddConnectionDialog } from "./-components/add-connection-dialog";
import { ConnectionsTable } from "./-components/connections-table";
export const Route = createFileRoute("/org/$slug/_app/settings/connections/")({
  head: () => ({ meta: [{ title: "SSO connections · Settings · Preface" }] }),
  validateSearch: previewSearch,
  component: Connections,
});

/** `?state=add` opens Add connection; `?state=empty` shows an organization without SSO. */
function Connections() {
  const { slug } = Route.useParams();
  const state = previewState(["add", "empty"], Route.useSearch().state);
  const [adding, setAdding] = React.useState(state === "add");
  const empty = state === "empty";

  return (
    <SettingsFrame
      crumbs={[{ label: "SSO connections" }]}
      width="full"
      actions={
        empty ? null : (
          <Button onClick={() => setAdding(true)}>
            <PlusIcon data-icon="inline-start" />
            Add connection
          </Button>
        )
      }
    >
      <PageTitle
        title="SSO connections"
        description="Connect your identity provider with OIDC or SAML. Test it, activate it, then approve it in the login policy."
      />
      {empty ? (
        <EmptyState
          bordered
          art={<SSOConnectedIllustration />}
          title="No SSO connections yet"
          description="Add Okta, Microsoft Entra ID, Google Workspace or any OIDC or SAML provider. Members keep signing in with email codes until you require SSO."
          actions={
            <>
              <Button onClick={() => setAdding(true)}>
                <PlusIcon data-icon="inline-start" />
                Add connection
              </Button>
              <Button variant="outline" onClick={feedback.notConnected}>
                <BookIcon data-icon="inline-start" />
                Read the SSO guide
              </Button>
            </>
          }
        />
      ) : (
        <>
          <ConnectionsTable slug={slug} />
          <Notice
            tone="neutral"
            action={
              <Link
                to="/org/$slug/settings/authentication"
                params={{ slug }}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Open login policy
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            }
          >
            Members can only use a connection after it’s active and approved in the login policy.
          </Notice>
        </>
      )}
      <AddConnectionDialog open={adding} onOpenChange={setAdding} preview={state === "add"} />
    </SettingsFrame>
  );
}
