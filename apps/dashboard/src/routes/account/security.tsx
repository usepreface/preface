import { useState } from "react";

import { createFileRoute, useRouter } from "@tanstack/react-router";

import type { SessionId } from "@usepreface/protocol";
import { Badge, BadgeDot } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@usepreface/ui/components/table";
import { BrowserIcon, ShieldIcon, TrashIcon } from "@usepreface/ui/icons";

import {
  accountsStartGoogleMutation,
  accountsUnlinkMutation,
  sessionsRevokeMutation,
  sessionsRevokeAllMutation,
} from "#/atoms/auth";
import { ApiClient } from "#/atoms/client";
import {
  organizationIdentityConnectionsLinkMutation,
  organizationIdentityConnectionsReauthenticateMutation,
} from "#/atoms/identity";
import { QueryKeys } from "#/atoms/query-keys";
import { Pagination } from "#/components/api/pagination";
import { QueryState } from "#/components/api/query-state";
import { useResetAuthority } from "#/components/api/registry-provider";
import { TableCard } from "#/components/data-display/table-card";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { PageBar, PageContent, PageTitle, PageSection } from "#/components/shell/page";
import { toMutation } from "#/hooks/mutation";
import { useMethods } from "#/hooks/organizations";
import { toQuery } from "#/hooks/query";
import { formatDate } from "#/lib/dates";
import { feedback } from "#/lib/feedback";
import { requestFields } from "#/lib/request-fields";

export const Route = createFileRoute("/account/security")({ component: Security });
const useAccounts = toQuery(() =>
  ApiClient.query(
    "accounts",
    "list",
    requestFields({ reactivityKeys: [QueryKeys.authority, QueryKeys.account] }),
  ),
);
const useSessions = toQuery((cursor?: SessionId) =>
  ApiClient.query(
    "sessions",
    "list",
    requestFields({
      query: { cursor, limit: 100 },
      reactivityKeys: [QueryKeys.authority, QueryKeys.account],
    }),
  ),
);
const useGoogleMethods = toQuery(() =>
  ApiClient.query("google", "methods", requestFields({ reactivityKeys: [QueryKeys.instance] })),
);
const useLinkGoogle = toMutation(accountsStartGoogleMutation);
const useUnlink = toMutation(accountsUnlinkMutation);
const useRevoke = toMutation(sessionsRevokeMutation);
const useRevokeAll = toMutation(sessionsRevokeAllMutation);
function Security() {
  const accounts = useAccounts();
  const [cursor, setCursor] = useState<SessionId>();
  const sessions = useSessions(cursor);
  const google = useGoogleMethods();
  const linkGoogle = useLinkGoogle();
  const unlink = useUnlink();
  const revoke = useRevoke();
  const revokeAll = useRevokeAll();
  const router = useRouter();
  const resetAuthority = useResetAuthority();
  const [confirm, setConfirm] = useState<{ title: string; run: () => Promise<void> }>();
  async function signedOut() {
    resetAuthority();
    await router.navigate({ to: "/sign-in" });
    await router.invalidate();
  }
  return (
    <>
      <PageBar crumbs={[{ label: "Account" }, { label: "Accounts and sessions" }]} />
      <PageContent width="lg">
        <PageTitle
          title="Accounts and sessions"
          description="The ways you sign in, and the devices signed in to your account."
        />
        <PageSection
          title="Connected accounts"
          actions={
            google.data?.google ? (
              <Button
                disabled={linkGoogle.pending}
                onClick={async () => {
                  const response = await linkGoogle.run({
                    payload: { returnPath: "/account/security" },
                  });
                  if (response) window.location.assign(response.value.authorizationUrl);
                }}
              >
                Connect Google
              </Button>
            ) : null
          }
        >
          <QueryState query={accounts}>
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="max-md:hidden">Connected</TableHead>
                    <TableHead className="w-0">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.data?.accounts
                    .filter((account) => !account.unlinkedAt)
                    .map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-surface-2">
                              <ShieldIcon className="size-4 text-icon-secondary" />
                            </span>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {account.provider.toUpperCase()}
                              </span>
                              <span className="text-caption text-fg-tertiary">
                                {account.providerEmail ?? "Connected identity"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge tone={account.connectionAvailable ? "success" : "neutral"}>
                            <BadgeDot />
                            {account.connectionAvailable ? "Connected" : "Unavailable"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-fg-secondary max-md:hidden">
                          {formatDate(account.linkedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              disabled={unlink.pending}
                              onClick={() =>
                                setConfirm({
                                  title: "Unlink this account?",
                                  run: async () => {
                                    if (await unlink.run({ params: { accountId: account.id } })) {
                                      setConfirm(undefined);
                                      feedback.done("Account unlinked");
                                    }
                                  },
                                })
                              }
                            >
                              Unlink
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {accounts.data?.accounts.every((account) => account.unlinkedAt) ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-fg-secondary">
                        No connected accounts.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableCard>
          </QueryState>
        </PageSection>
        <EnterpriseAccounts />
        <PageSection
          title="Active sessions"
          actions={
            <Button
              variant="outline"
              onClick={() =>
                setConfirm({
                  title: "Sign out all sessions?",
                  run: async () => {
                    if (await revokeAll.run()) {
                      setConfirm(undefined);
                      await signedOut();
                    }
                  },
                })
              }
            >
              Sign out all sessions
            </Button>
          }
        >
          <QueryState query={sessions}>
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead className="max-md:hidden">Created</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead className="max-md:hidden">Expires</TableHead>
                    <TableHead className="w-0">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.data?.sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-surface-2">
                            <BrowserIcon className="size-4 text-icon-secondary" />
                          </span>
                          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            {session.isCurrent ? "This browser" : "Browser session"}
                            {session.isCurrent ? (
                              <Badge tone="success">
                                <BadgeDot />
                                Current session
                              </Badge>
                            ) : null}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-fg-secondary max-md:hidden">
                        {formatDate(session.createdAt)}
                      </TableCell>
                      <TableCell className="text-fg-secondary">
                        {formatDate(session.lastSeenAt)}
                      </TableCell>
                      <TableCell className="text-fg-secondary max-md:hidden">
                        {formatDate(session.expiresAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          disabled={revoke.pending}
                          onClick={() =>
                            setConfirm({
                              title: session.isCurrent
                                ? "Sign out this browser?"
                                : "Revoke this session?",
                              run: async () => {
                                if (await revoke.run({ params: { sessionId: session.id } })) {
                                  setConfirm(undefined);
                                  if (session.isCurrent) await signedOut();
                                }
                              },
                            })
                          }
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          </QueryState>
          <Pagination cursor={cursor} nextCursor={sessions.data?.nextCursor} onChange={setCursor} />
        </PageSection>
        <ConfirmDialog
          open={Boolean(confirm)}
          onOpenChange={(open) => {
            if (!open) setConfirm(undefined);
          }}
          pending={unlink.pending || revoke.pending || revokeAll.pending}
          icon={TrashIcon}
          title={confirm?.title ?? "Confirm change"}
          description="This takes effect immediately."
          confirmLabel="Confirm"
          onConfirm={() => confirm?.run()}
        />
      </PageContent>
    </>
  );
}
function EnterpriseAccounts() {
  return (
    <PageSection title="Organization SSO" description="Link your identity provider account.">
      <EnterpriseMethods />
    </PageSection>
  );
}
const useLinkSso = toMutation(organizationIdentityConnectionsLinkMutation);
const useReauthenticate = toMutation(organizationIdentityConnectionsReauthenticateMutation);
function EnterpriseMethods() {
  const methods = useMethods();
  const link = useLinkSso();
  const reauthenticate = useReauthenticate();
  return (
    <QueryState query={methods}>
      <div className="flex flex-wrap gap-3">
        {[...(methods.data?.oidc ?? []), ...(methods.data?.saml ?? [])].map((method) => (
          <Button
            key={method.id}
            disabled={!method.available || link.pending || reauthenticate.pending}
            onClick={async () => {
              const input = {
                params: { connectionId: method.id },
                payload: { returnPath: "/account/security" },
              };
              const response = method.linked
                ? await reauthenticate.run(input)
                : await link.run(input);
              if (response) window.location.assign(response.value.authorizationUrl);
            }}
          >
            {method.linked ? "Confirm" : "Link"} {method.name}
          </Button>
        ))}
      </div>
      {methods.data && !methods.data.oidc.length && !methods.data.saml.length ? (
        <p className="text-sm text-fg-secondary">No approved enterprise providers.</p>
      ) : null}
    </QueryState>
  );
}
