import { useState } from "react";

import { createFileRoute, useRouter } from "@tanstack/react-router";

import type { SessionId, OrganizationId } from "@usepreface/protocol";
import { Button } from "@usepreface/ui/components/button";
import { TrashIcon } from "@usepreface/ui/icons";

import {
  accountsStartGoogleMutation,
  reauthenticationStartGoogleMutation,
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
import { ReauthenticationLink } from "#/components/auth/reauthentication-link";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { Notice } from "#/components/feedback/notice";
import { PageBar, PageContent, PageTitle, PageSection } from "#/components/shell/page";
import { toMutation } from "#/hooks/mutation";
import { useOrganizations, useMethods } from "#/hooks/organizations";
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
const useConfirmGoogle = toMutation(reauthenticationStartGoogleMutation);
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
  const confirmGoogle = useConfirmGoogle();
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
          description="Manage your connected identities and active browser sessions."
        />
        <Notice action={<ReauthenticationLink />}>
          Linking and unlinking accounts requires a recent email confirmation.
        </Notice>
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
            <div className="flex flex-col divide-y rounded-xl border">
              {accounts.data?.accounts
                .filter((account) => !account.unlinkedAt)
                .map((account) => (
                  <div key={account.id} className="flex flex-wrap items-center gap-4 p-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">
                        {account.provider.toUpperCase()} ·{" "}
                        {account.providerEmail ?? "Connected identity"}
                      </h3>
                      <p className="text-xs text-fg-tertiary">
                        Linked {formatDate(account.linkedAt)} ·{" "}
                        {account.connectionAvailable ? "Available" : "Unavailable"}
                      </p>
                    </div>
                    {account.provider === "google" && account.connectionAvailable ? (
                      <Button
                        variant="outline"
                        disabled={confirmGoogle.pending}
                        onClick={async () => {
                          const response = await confirmGoogle.run({
                            payload: { returnPath: "/account/security" },
                          });
                          if (response) window.location.assign(response.value.authorizationUrl);
                        }}
                      >
                        Confirm Google
                      </Button>
                    ) : null}
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
                ))}
              {accounts.data?.accounts.every((account) => account.unlinkedAt) ? (
                <p className="p-4 text-sm text-fg-secondary">No connected accounts.</p>
              ) : null}
            </div>
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
            <div className="flex flex-col divide-y rounded-xl border">
              {sessions.data?.sessions.map((session) => (
                <div key={session.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">
                      {session.isCurrent ? "This browser" : "Browser session"}
                    </h3>
                    <p className="text-xs text-fg-tertiary">
                      Created {formatDate(session.createdAt)} · Last seen{" "}
                      {formatDate(session.lastSeenAt)} · Expires {formatDate(session.expiresAt)}
                    </p>
                  </div>
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
                </div>
              ))}
            </div>
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
  const [cursor, setCursor] = useState<OrganizationId>();
  const organizations = useOrganizations(cursor);
  const [selected, setSelected] = useState<OrganizationId>();
  return (
    <PageSection
      title="Organization SSO"
      description="Link or confirm an approved identity provider for an organization you belong to."
    >
      <QueryState query={organizations}>
        <div className="flex flex-wrap gap-2">
          {organizations.data?.organizations
            .filter((organization) => !organization.archivedAt)
            .map((organization) => (
              <Button
                variant="outline"
                key={organization.id}
                onClick={() => setSelected(organization.id)}
              >
                {organization.metadata.name}
              </Button>
            ))}
        </div>
        <Pagination
          cursor={cursor}
          nextCursor={organizations.data?.nextCursor}
          onChange={setCursor}
        />
      </QueryState>
      {selected ? <EnterpriseMethods key={selected} organizationId={selected} /> : null}
    </PageSection>
  );
}
const useLinkSso = toMutation(organizationIdentityConnectionsLinkMutation);
const useReauthenticate = toMutation(organizationIdentityConnectionsReauthenticateMutation);
function EnterpriseMethods({ organizationId }: { organizationId: OrganizationId }) {
  const methods = useMethods(organizationId);
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
                params: { organizationId, connectionId: method.id },
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
