import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Redacted } from "effect";

import type { PublicGoogleConnection } from "@usepreface/protocol/dto";
import { Badge, BadgeDot } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { TrashIcon } from "@usepreface/ui/icons";
import { LogoTile } from "@usepreface/ui/preface/data-display";

import { ApiClient } from "#/atoms/client";
import { QueryKeys } from "#/atoms/query-keys";
import { QueryState } from "#/components/api/query-state";
import { ReauthenticationLink } from "#/components/auth/reauthentication-link";
import { CopyField } from "#/components/data-display/copy-field";
import { StepProgress } from "#/components/data-display/step-progress";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { Notice } from "#/components/feedback/notice";
import { SaveBar } from "#/components/form/save-bar";
import { TextField } from "#/components/form/text-field";
import { PageTitle } from "#/components/shell/page";
import { SectionCard } from "#/components/shell/section-card";
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
        leading={<LogoTile brand="google" size={44} />}
        title="Installation Google"
        badges={
          <Badge tone={query.data?.status === "active" ? "success" : "neutral"}>
            <BadgeDot />
            {query.data?.status ?? "Not configured"}
          </Badge>
        }
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
    <>
      <StepProgress
        steps={["Configure", "Test login", "Activate"]}
        current={
          connection.status === "active"
            ? 4
            : connection.testedRevision === connection.revision && connection.id
              ? 3
              : connection.id
                ? 2
                : 1
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-5">
          <form
            className="flex flex-col gap-4 rounded-xl border bg-surface-1 px-6 py-5"
            onSubmit={form.handleSubmit(async (values) => {
              const response = await save.run({
                payload: {
                  ...values,
                  expectedRevision: version.revision,
                  clientSecret: values.clientSecret
                    ? Redacted.value(values.clientSecret)
                    : undefined,
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
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-semibold text-foreground">OAuth client</h2>
              <p className="text-13 text-fg-secondary">
                From Google Cloud Console → APIs &amp; Services → Credentials.
              </p>
            </div>
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
            <Button type="button" variant="outline" onClick={version.reload}>
              Reload saved settings
            </Button>
            {version.conflicted ? (
              <p role="alert" className="text-sm text-warning-fg">
                Saved settings changed. Reload them before saving your edits.
              </p>
            ) : null}
            <SaveBar
              dirty={form.formState.isDirty || !connection.id}
              pending={save.pending}
              onReset={version.reload}
              saveLabel="Save Google client"
            />
          </form>
          <SectionCard
            title="Callback URL"
            description="Add it as an authorized redirect URI on the OAuth client."
          >
            <CopyField label="Google callback URL" value={connection.callbackUrl} />
          </SectionCard>
        </div>
        <div className="flex flex-col gap-5">
          <SectionCard title="Test and activate">
            <p className="text-13 text-fg-secondary">
              Last tested: {formatDate(connection.testedAt)}. Test the saved client before
              activation.
            </p>
            <div className="flex flex-col gap-2.5">
              <Button
                disabled={test.pending || !connection.id}
                onClick={async () => {
                  const response = await test.run({
                    payload: { expectedRevision: connection.revision },
                  });
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
                onClick={() =>
                  void activate.run({ payload: { expectedRevision: connection.revision } })
                }
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
          </SectionCard>
          <SectionCard title="Organization access">
            <p className="text-13 text-fg-secondary">
              Organizations choose whether to allow Google in their login policy. Only invited
              people can join.
            </p>
          </SectionCard>
        </div>
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
    </>
  );
}
