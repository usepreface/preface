import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge, BadgeDot } from "@usepreface/ui/components/badge";
import { Button, buttonVariants } from "@usepreface/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import { PlusIcon, LockKeyIcon } from "@usepreface/ui/icons";
import { SSOConnectedIllustration } from "@usepreface/ui/illustrations";

import { Permission } from "#/components/api/permission";
import { QueryState } from "#/components/api/query-state";
import { IconTile } from "#/components/data-display/icon-tile";
import { TableCard } from "#/components/data-display/table-card";
import { EmptyState } from "#/components/feedback/empty-state";
import { PageTitle } from "#/components/shell/page";
import { useOrganization, useConnections } from "#/hooks/organizations";
import { formatDate } from "#/lib/dates";

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
      width="full"
      actions={
        <Button onClick={() => setAdding(true)}>
          <PlusIcon data-icon="inline-start" />
          Add connection
        </Button>
      }
    >
      <PageTitle
        title="SSO connections"
        description="Configure, test and activate organization-owned OIDC and SAML providers."
      />
      <QueryState query={query}>
        {query.data?.connections.length === 0 ? (
          <EmptyState
            bordered
            art={<SSOConnectedIllustration />}
            title="Add your first SSO connection"
            description="Connect an OIDC or SAML identity provider, test it, then approve it in the login policy."
          />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Connection</TableHead>
                  <TableHead className="max-sm:hidden">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="max-md:hidden">Last tested</TableHead>
                  <TableHead className="w-0">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.connections.map((connection) => (
                  <TableRow
                    key={connection.id}
                    className={connection.status === "disabled" ? "opacity-70" : undefined}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <IconTile icon={LockKeyIcon} size={32} />
                        <Link
                          to="/org/$slug/settings/connections/$connectionId"
                          params={{ slug: organization.slug, connectionId: connection.id }}
                          className="text-sm font-medium text-foreground hover:underline"
                        >
                          {connection.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="max-sm:hidden">
                      <Badge variant="outline">{connection.provider.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          connection.status === "active"
                            ? "success"
                            : connection.status === "tested"
                              ? "info"
                              : "neutral"
                        }
                      >
                        <BadgeDot />
                        {connection.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-fg-secondary max-md:hidden">
                      {formatDate(connection.testedAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/org/$slug/settings/connections/$connectionId"
                        params={{ slug: organization.slug, connectionId: connection.id }}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        Configure
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </QueryState>
      {adding ? <AddConnectionDialog onClose={() => setAdding(false)} /> : null}
    </SettingsFrame>
  );
}
