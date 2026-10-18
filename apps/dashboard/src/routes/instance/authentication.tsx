import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Redacted } from "effect";

import type { PublicGoogleConnection } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";
import { TrashIcon } from "@usepreface/ui/icons";

import { ApiClient } from "#/atoms/client";
import { QueryKeys } from "#/atoms/query-keys";
import { QueryState } from "#/components/api/query-state";
import { ReauthenticationLink } from "#/components/auth/reauthentication-link";
import { CopyField } from "#/components/data-display/copy-field";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { Notice } from "#/components/feedback/notice";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { PageTitle } from "#/components/shell/page";
import { googleConnectionForm, initialGoogleConnectionForm } from "#/forms/instance";
import {
  useIdentityConnectionsSaveGoogle,
  useIdentityConnectionsTestGoogle,
  useIdentityConnectionsActivateGoogle,
  useIdentityConnectionsDisableGoogle,
} from "#/hooks/identity";
import { toQuery } from "#/hooks/query";
import { formatDate } from "#/lib/dates";
import { feedback } from "#/lib/feedback";
import { useRevisionForm } from "#/lib/forms/use-revision-form";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { requestFields } from "#/lib/request-fields";

import { InstancePage } from "./-components/instance-page";

export const Route = createFileRoute("/instance/authentication")({ component: Google });
const useGoogle = toQuery(() =>
  ApiClient.query(
    "identityConnections",
    "getGoogle",
    requestFields({
      reactivityKeys: [QueryKeys.authority, QueryKeys.instance],
    }),
  ),
);
function Google() {
  const query = useGoogle();
  return (
    <InstancePage crumbs={[{ label: "Google sign-in" }]}>
      <PageTitle
        title="Installation Google"
        description="One OAuth client for this instance. Organization owners opt in separately."
      />
      <Notice action={<ReauthenticationLink />}>
        Configuration changes and tests require a recent email confirmation.
      </Notice>
      <QueryState query={query}>
        {query.data ? <GoogleForm connection={query.data} /> : null}
      </QueryState>
    </InstancePage>
  );
}
function GoogleForm({ connection }: { connection: typeof PublicGoogleConnection.Type }) {
  const [disabling, setDisabling] = useState(false);
  const save = useIdentityConnectionsSaveGoogle();
  const test = useIdentityConnectionsTestGoogle();
  const activate = useIdentityConnectionsActivateGoogle();
  const disable = useIdentityConnectionsDisableGoogle();
  const savedValues = { name: connection.name, clientId: connection.configuration?.clientId ?? "" };
  const form = useSchemaForm(
    connection.hasClientSecret ? googleConnectionForm : initialGoogleConnectionForm,
    {
      defaultValues: savedValues,
    },
  );
  const version = useRevisionForm(form, connection.revision, savedValues);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-fg-secondary">
        {connection.status ?? "Not configured"} · Revision {connection.revision} · Last tested{" "}
        {formatDate(connection.testedAt)}
      </p>
      <form
        className="flex flex-col gap-5 rounded-xl border p-5"
        onSubmit={form.handleSubmit(async (values) => {
          const response = await save.run({
            payload: {
              ...values,
              expectedRevision: version.revision,
              clientSecret: values.clientSecret ? Redacted.value(values.clientSecret) : undefined,
            },
          });
          if (response) {
            version.accept(response.value.revision, {
              ...form.getValues(),
              clientSecret: undefined,
            });
            feedback.saved("Google configuration");
          }
        })}
      >
        <TextField control={form.control} name="name" label="Connection name" />
        <TextField control={form.control} name="clientId" label="Client ID" />
        <TextField
          control={form.control}
          name="clientSecret"
          label={connection.hasClientSecret ? "Replacement client secret" : "Client secret"}
          optional={connection.hasClientSecret}
          emptyAsUndefined
          inputProps={{ type: "password", autoComplete: "new-password" }}
          description="Leaving this empty keeps an existing stored secret."
        />
        <p className="text-sm font-medium">
          Register this exact callback URL in Google Cloud Console
        </p>
        <CopyField label="Google callback URL" value={connection.callbackUrl} />
        <Button type="button" variant="outline" onClick={version.reload}>
          Reload saved settings
        </Button>
        {version.conflicted ? (
          <p role="alert" className="text-sm text-warning-fg">
            Saved settings changed. Reload them before saving your edits.
          </p>
        ) : null}
        <SubmitButton pending={save.pending}>Save Google client</SubmitButton>
      </form>
      <div className="flex gap-3">
        <Button
          disabled={test.pending || !connection.id}
          onClick={async () => {
            const response = await test.run({ payload: { expectedRevision: connection.revision } });
            if (response) window.location.assign(response.value.authorizationUrl);
          }}
        >
          Test login
        </Button>
        <Button
          variant="outline"
          disabled={
            activate.pending ||
            !connection.id ||
            connection.testedRevision !== connection.revision ||
            connection.status === "active"
          }
          onClick={() => void activate.run({ payload: { expectedRevision: connection.revision } })}
        >
          Activate tested revision
        </Button>
        <Button
          variant="outline"
          disabled={!connection.id || connection.status === "disabled"}
          onClick={() => setDisabling(true)}
        >
          Disable
        </Button>
      </div>
      <ConfirmDialog
        open={disabling}
        onOpenChange={setDisabling}
        pending={disable.pending}
        icon={TrashIcon}
        title="Disable Google sign-in?"
        description="Google authentication evidence becomes unusable across organizations. Independent email proof remains available."
        confirmLabel="Disable Google"
        onConfirm={async () => {
          if (await disable.run({ payload: { expectedRevision: connection.revision } }))
            setDisabling(false);
        }}
      />
    </div>
  );
}
