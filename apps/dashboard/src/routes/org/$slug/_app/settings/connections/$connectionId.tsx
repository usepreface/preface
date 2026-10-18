import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { Schema } from "effect";

import { IdentityConnectionId } from "@usepreface/protocol";
import type { PublicOrganizationIdentityConnection } from "@usepreface/protocol/dto";
import { Badge, BadgeDot } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { LockKeyIcon, TrashIcon } from "@usepreface/ui/icons";

import { Permission } from "#/components/api/permission";
import { QueryState } from "#/components/api/query-state";
import { ReauthenticationLink } from "#/components/auth/reauthentication-link";
import { IconTile } from "#/components/data-display/icon-tile";
import { StepProgress } from "#/components/data-display/step-progress";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { Notice } from "#/components/feedback/notice";
import { PageTitle } from "#/components/shell/page";
import { SectionCard } from "#/components/shell/section-card";
import {
  useOrganizationIdentityConnectionsTest,
  useOrganizationIdentityConnectionsActivate,
  useOrganizationIdentityConnectionsDisable,
  useOrganizationIdentityConnectionsRefreshMetadata,
} from "#/hooks/identity";
import { useOrganization, useConnection } from "#/hooks/organizations";
import { formatDate } from "#/lib/dates";

import { SettingsFrame } from "../-components/settings-frame";
import { ConnectionDomains } from "./-components/connection-domains";
import { ConnectionHealth } from "./-components/connection-health";
import { OidcSettings } from "./-components/oidc-settings";
import { SamlKeys } from "./-components/saml-keys";
import { SamlSettings } from "./-components/saml-settings";

export const Route = createFileRoute("/org/$slug/_app/settings/connections/$connectionId")({
  component: () => (
    <Permission owner>
      <Connection />
    </Permission>
  ),
});
function Connection() {
  const { organization } = useOrganization();
  const id = Schema.decodeUnknownSync(IdentityConnectionId)(Route.useParams().connectionId);
  const query = useConnection(organization.id, id);
  return (
    <SettingsFrame
      width="full"
      crumbs={[
        {
          label: "SSO connections",
          link: { to: "/org/$slug/settings/connections", params: { slug: organization.slug } },
        },
        { label: query.data?.name ?? "Connection" },
      ]}
    >
      <QueryState query={query}>
        {query.data ? <ConnectionContent connection={query.data} /> : null}
      </QueryState>
    </SettingsFrame>
  );
}
function ConnectionContent({
  connection,
}: {
  connection: typeof PublicOrganizationIdentityConnection.Type;
}) {
  const { organization } = useOrganization();
  const test = useOrganizationIdentityConnectionsTest();
  const activate = useOrganizationIdentityConnectionsActivate();
  const disable = useOrganizationIdentityConnectionsDisable();
  const refresh = useOrganizationIdentityConnectionsRefreshMetadata();
  const [disabling, setDisabling] = useState(false);
  const params = { organizationId: organization.id, connectionId: connection.id };
  const payload = { expectedRevision: connection.revision };
  return (
    <>
      <PageTitle
        title={connection.name}
        leading={<IconTile icon={LockKeyIcon} size={44} />}
        badges={
          <>
            <Badge variant="outline">{connection.provider.toUpperCase()}</Badge>
            <Badge tone={connection.status === "active" ? "success" : "neutral"}>
              <BadgeDot />
              {connection.status}
            </Badge>
          </>
        }
        description={`Created ${formatDate(connection.createdAt)}`}
      />
      <Notice action={<ReauthenticationLink />}>
        Connection changes require a recent email confirmation. Test the saved revision before
        activation.
      </Notice>
      <StepProgress
        steps={["Configure", "Test login", "Activate", "Approve"]}
        current={
          connection.status === "active"
            ? 4
            : connection.testedRevision === connection.revision
              ? 3
              : 2
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex flex-col gap-5">
          {connection.provider === "oidc" ? (
            <OidcSettings connection={connection} />
          ) : (
            <>
              <SamlSettings connection={connection} />
              <SamlKeys connection={connection} />
            </>
          )}
          <ConnectionDomains connection={connection} />
        </div>
        <div className="flex flex-col gap-5">
          <SectionCard title="Last test">
            <p className="text-13 text-fg-secondary">
              Last tested: {formatDate(connection.testedAt)}. Test the saved revision before
              activation.
            </p>
            <div className="flex flex-col gap-2.5">
              <Button
                disabled={test.pending}
                onClick={async () => {
                  const response = await test.run({ params, payload });
                  if (response) window.location.assign(response.value.authorizationUrl);
                }}
              >
                Test login
              </Button>
              <Button
                variant="outline"
                disabled={
                  activate.pending ||
                  connection.testedRevision !== connection.revision ||
                  connection.status === "active"
                }
                onClick={() => void activate.run({ params, payload })}
              >
                Activate tested revision
              </Button>

              {connection.provider === "oidc" ? (
                <Button
                  variant="outline"
                  disabled={refresh.pending}
                  onClick={() => void refresh.run({ params, payload })}
                >
                  Refresh discovery metadata
                </Button>
              ) : null}
            </div>
          </SectionCard>
          <SectionCard title="Next">
            <p className="text-13 text-fg-secondary">
              After activation, approve this connection in the login policy so members can use it.
            </p>
            <Link
              to="/org/$slug/settings/authentication"
              params={{ slug: organization.slug }}
              className="text-sm font-medium text-fg-accent"
            >
              Open login policy
            </Link>
          </SectionCard>
          <SectionCard title="Health">
            <ConnectionHealth connectionId={connection.id} />
          </SectionCard>
          <SectionCard title="Disable connection" danger>
            <p className="text-13 text-fg-secondary">
              Stops sign-ins immediately. Configuration is kept.
            </p>
            <Button
              variant="destructive-outline"
              disabled={connection.status === "disabled"}
              onClick={() => setDisabling(true)}
            >
              Disable
            </Button>
          </SectionCard>
        </div>
      </div>
      <ConfirmDialog
        open={disabling}
        onOpenChange={setDisabling}
        pending={disable.pending}
        icon={TrashIcon}
        title="Disable connection?"
        description="Authentication evidence from this connection becomes unusable."
        confirmLabel="Disable connection"
        onConfirm={async () => {
          if (await disable.run({ params, payload })) setDisabling(false);
        }}
      />
    </>
  );
}
