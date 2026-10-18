import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { Button, buttonVariants } from "@usepreface/ui/components/button";

import { Permission } from "#/components/api/permission";
import { QueryState } from "#/components/api/query-state";
import { PageTitle } from "#/components/shell/page";
import { useOrganization, useConnections } from "#/hooks/organizations";

import { SettingsFrame } from "../-components/settings-frame";
import { AddConnectionDialog } from "./-components/add-connection-dialog";

export const Route = createFileRoute("/org/$slug/_app/settings/connections/")({
  component: () => (
    <Permission owner>
      <Connections />
    </Permission>
  ),
});
function Connections() {
  const { organization } = useOrganization();
  const query = useConnections(organization.id);
  const [adding, setAdding] = useState(false);
  return (
    <SettingsFrame
      crumbs={[{ label: "SSO connections" }]}
      actions={<Button onClick={() => setAdding(true)}>Add connection</Button>}
    >
      <PageTitle
        title="SSO connections"
        description="Configure, test and activate organization-owned OIDC and SAML providers."
      />
      <QueryState query={query}>
        <div className="flex flex-col gap-3">
          {query.data?.connections.map((connection) => (
            <article
              key={connection.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border p-4"
            >
              <div className="flex-1">
                <h2 className="text-sm font-semibold">{connection.name}</h2>
                <p className="text-xs text-fg-tertiary">
                  {connection.provider.toUpperCase()} · {connection.status} · Revision{" "}
                  {connection.revision}
                </p>
              </div>
              <Link
                to="/org/$slug/settings/connections/$connectionId"
                params={{ slug: organization.slug, connectionId: connection.id }}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Configure
              </Link>
            </article>
          ))}
          {query.data?.connections.length === 0 ? (
            <p className="text-sm text-fg-secondary">
              No connections yet. Add your identity provider to begin.
            </p>
          ) : null}
        </div>
      </QueryState>
      {adding ? <AddConnectionDialog onClose={() => setAdding(false)} /> : null}
    </SettingsFrame>
  );
}
