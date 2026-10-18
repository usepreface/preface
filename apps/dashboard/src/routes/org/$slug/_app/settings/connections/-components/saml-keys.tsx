import { useState } from "react";

import type {
  OrganizationId,
  IdentityConnectionId,
  IdentityConnectionKeyId,
} from "@usepreface/protocol";
import type { PublicSamlConnection } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";
import { TrashIcon } from "@usepreface/ui/icons";

import { ApiClient } from "#/atoms/client";
import { QueryKeys } from "#/atoms/query-keys";
import { QueryState } from "#/components/api/query-state";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { Notice } from "#/components/feedback/notice";
import { PageSection } from "#/components/shell/page";
import {
  useConnectionOperationsPrepare,
  useConnectionOperationsTest,
  useConnectionOperationsActivate,
  useConnectionOperationsRetire,
} from "#/hooks/identity";
import { toQuery } from "#/hooks/query";
import { formatDate } from "#/lib/dates";
import { requestFields } from "#/lib/request-fields";
const useKeys = toQuery((organizationId: OrganizationId, connectionId: IdentityConnectionId) =>
  ApiClient.query(
    "connectionOperations",
    "keys",
    requestFields({
      params: { organizationId, connectionId },
      reactivityKeys: [QueryKeys.authority, QueryKeys.organization(organizationId)],
    }),
  ),
);
export function SamlKeys({ connection }: { connection: typeof PublicSamlConnection.Type }) {
  const query = useKeys(connection.organizationId, connection.id);
  const prepare = useConnectionOperationsPrepare();
  const test = useConnectionOperationsTest();
  const activate = useConnectionOperationsActivate();
  const retire = useConnectionOperationsRetire();
  const [retiring, setRetiring] = useState<IdentityConnectionKeyId>();
  const params = { organizationId: connection.organizationId, connectionId: connection.id };
  const payload = { expectedRevision: connection.revision };
  return (
    <PageSection
      title="Signing key rollover"
      actions={
        <Button
          variant="outline"
          disabled={prepare.pending}
          onClick={() => void prepare.run({ params, payload })}
        >
          Prepare signing key
        </Button>
      }
    >
      <Notice>
        Import overlapping metadata at your IdP before testing a prepared key. Activate only after a
        successful test. Retire old keys after the overlap period.
      </Notice>
      <QueryState query={query}>
        <div className="flex flex-col gap-3">
          {query.data?.keys.map((key) => (
            <article key={key.id} className="flex flex-col gap-3 rounded-xl border p-4">
              <p className="text-sm font-medium">
                {key.status} · Expires {formatDate(key.expiresAt)}
              </p>
              <details>
                <summary className="cursor-pointer text-sm">Signing certificate</summary>
                <pre className="whitespace-pre-wrap break-all text-xs">{key.certificate}</pre>
              </details>
              <p className="text-xs text-fg-tertiary">Tested {formatDate(key.testedAt)}</p>
              <div className="flex gap-2">
                {key.status === "pending" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={test.pending}
                      onClick={async () => {
                        const response = await test.run({
                          params: { ...params, keyId: key.id },
                          payload,
                        });
                        if (response) window.location.assign(response.value.authorizationUrl);
                      }}
                    >
                      Test prepared key
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={activate.pending || !key.testedAt}
                      onClick={() =>
                        void activate.run({ params: { ...params, keyId: key.id }, payload })
                      }
                    >
                      Activate key
                    </Button>
                  </>
                ) : null}
                {key.status === "retiring" ? (
                  <Button size="sm" variant="outline" onClick={() => setRetiring(key.id)}>
                    Retire key
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </QueryState>
      <ConfirmDialog
        open={Boolean(retiring)}
        onOpenChange={(open) => {
          if (!open) setRetiring(undefined);
        }}
        pending={retire.pending}
        icon={TrashIcon}
        title="Retire signing key?"
        description="The old certificate is removed from published metadata."
        confirmLabel="Retire key"
        onConfirm={async () => {
          if (retiring && (await retire.run({ params: { ...params, keyId: retiring }, payload })))
            setRetiring(undefined);
        }}
      />
    </PageSection>
  );
}
