import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { Schema } from "effect";

import { IdentityConnectionId } from "@usepreface/protocol";
import type { PublicOrganizationIdentityConnection } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";
import { TrashIcon } from "@usepreface/ui/icons";

import { Permission } from "#/components/api/permission";
import { QueryState } from "#/components/api/query-state";
import { ReauthenticationLink } from "#/components/auth/reauthentication-link";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { Notice } from "#/components/feedback/notice";
import { PageTitle, PageSection } from "#/components/shell/page";
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
        description={`${connection.provider.toUpperCase()} · ${connection.status} · revision ${connection.revision}`}
      />
      <Notice action={<ReauthenticationLink />}>
        Connection changes require a recent email confirmation. Test the saved revision before
        activation.
      </Notice>
      <div className="flex flex-wrap gap-3">
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
        <Button
          variant="outline"
          disabled={connection.status === "disabled"}
          onClick={() => setDisabling(true)}
        >
          Disable
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
      <p className="text-sm text-fg-secondary">
        Last tested: {formatDate(connection.testedAt)}. After activation, approve the connection in{" "}
        <Link to="/org/$slug/settings/authentication" params={{ slug: organization.slug }}>
          login policy
        </Link>
        .
      </p>
      {connection.provider === "oidc" ? (
        <OidcSettings connection={connection} />
      ) : (
        <>
          <SamlSettings connection={connection} />
          <SamlKeys connection={connection} />
        </>
      )}
      <PageSection title="Health">
        <ConnectionHealth connectionId={connection.id} />
      </PageSection>
      <ConnectionDomains connection={connection} />
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
