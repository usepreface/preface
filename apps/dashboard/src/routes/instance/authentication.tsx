import * as React from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { AlertIcon, KeyIcon, PlayIcon } from "@usepreface/ui/icons";
import { LogoTile } from "@usepreface/ui/preface/data-display";

import { Checklist } from "#/components/data-display/checklist";
import { CopyField, SecretField } from "#/components/data-display/copy-field";
import { DetailList } from "#/components/data-display/detail-list";
import { StatusBadge } from "#/components/data-display/status-badge";
import { StepProgress } from "#/components/data-display/step-progress";
import { ConfirmDialog, ConsequenceList } from "#/components/feedback/confirm-dialog";
import { SaveBar } from "#/components/form/save-bar";
import { TextField } from "#/components/form/text-field";
import { PageTitle } from "#/components/shell/page";
import { SectionCard } from "#/components/shell/section-card";
import { googleConnectionForm } from "#/forms/instance";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { googleConnection } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";
import { connectionStatus } from "#/lib/status";
import { instanceUrl } from "#/lib/urls";

import { InstancePage } from "./-components/instance-page";

export const Route = createFileRoute("/instance/authentication")({
  head: () => ({ meta: [{ title: "Google sign-in · Instance · Preface" }] }),
  validateSearch: previewSearch,
  component: GoogleSignIn,
});

/*
 * One Google OAuth client for the whole instance; each organization opts in from its login
 * policy. `?state=draft` shows first-time setup and `?state=disable` the disable confirmation.
 */
function GoogleSignIn() {
  const state = previewState(["draft", "disable"], Route.useSearch().state);
  const draft = state === "draft";
  const [disabling, setDisabling] = React.useState(state === "disable");
  const [replacing, setReplacing] = React.useState(draft);
  const form = useSchemaForm(googleConnectionForm, {
    defaultValues: draft
      ? { name: "Google", clientId: "" }
      : { name: googleConnection.name, clientId: googleConnection.clientId },
  });
  const usedBy = googleConnection.usedBy.split(", ");

  return (
    <InstancePage
      crumbs={[{ label: "Google sign-in" }]}
      actions={
        draft ? null : (
          <>
            <Button variant="outline" onClick={feedback.notConnected}>
              <PlayIcon data-icon="inline-start" />
              Test login
            </Button>
            <Button variant="destructive-outline" onClick={() => setDisabling(true)}>
              Disable
            </Button>
          </>
        )
      }
    >
      <PageTitle
        leading={<LogoTile brand="google" size={44} />}
        title="Installation Google"
        badges={<StatusBadge status={connectionStatus[draft ? "draft" : "active"]} />}
        description="One Google OAuth client for the whole instance. Each organization opts in from its login policy."
      />
      <StepProgress steps={["Configure", "Test login", "Activate"]} current={draft ? 1 : 4} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-5">
          <form
            noValidate
            className="flex flex-col gap-4 rounded-xl border bg-surface-1 px-6 py-5"
            onSubmit={form.handleSubmit(() => {
              if (draft) {
                feedback.notConnected();
                return;
              }
              feedback.saved("Google sign-in");
              form.reset(form.getValues());
              setReplacing(false);
            })}
          >
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-semibold text-foreground">OAuth client</h2>
              <p className="text-13 text-fg-secondary">
                From Google Cloud Console → APIs &amp; Services → Credentials.
              </p>
            </div>
            <TextField
              control={form.control}
              name="name"
              label="Connection name"
              emptyAsUndefined
              description="Shown on sign-in buttons as “Continue with Google”."
            />
            <TextField
              control={form.control}
              name="clientId"
              label="Client ID"
              inputProps={{
                placeholder: "123456789-abc.apps.googleusercontent.com",
                className: "font-mono text-mono-sm",
              }}
            />
            {replacing ? (
              <TextField
                control={form.control}
                name="clientSecret"
                label="Client secret"
                emptyAsUndefined
                leading={<KeyIcon />}
                description={draft ? undefined : "Leave empty to keep the saved secret."}
                inputProps={{ type: "password", placeholder: "GOCSPX-…", autoComplete: "off" }}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Client secret</span>
                <SecretField
                  hint={googleConnection.secretHint}
                  label="client secret"
                  onReplace={() => setReplacing(true)}
                />
              </div>
            )}
            <SaveBar
              dirty={form.formState.isDirty || draft}
              pending={form.formState.isSubmitting}
              onReset={() => {
                form.reset();
                setReplacing(draft);
              }}
              saveLabel={draft ? "Save and test" : "Save changes"}
            />
          </form>
          <SectionCard
            title="Callback URL"
            description="Add it as an authorized redirect URI on the OAuth client."
          >
            <CopyField value={instanceUrl("/auth/google/callback")} label="Callback URL" />
          </SectionCard>
        </div>
        <div className="flex flex-col gap-5">
          {draft ? (
            <SectionCard title="Before you test">
              <Checklist
                checks={[
                  { state: "done", title: "Callback URL copied" },
                  {
                    state: "waiting",
                    title: "Client ID and secret",
                    detail: "Paste both from Google Cloud",
                  },
                  {
                    state: "waiting",
                    title: "Test login",
                    detail: "Sign in once with a Google account",
                  },
                ]}
              />
            </SectionCard>
          ) : (
            <>
              <SectionCard title="Status">
                <DetailList
                  labelWidth="w-22"
                  items={[
                    { label: "State", value: <StatusBadge status={connectionStatus.active} /> },
                    { label: "Last test", value: googleConnection.lastTest },
                    { label: "Tested by", value: googleConnection.testedBy },
                    { label: "Used by", value: googleConnection.usedBy },
                  ]}
                />
              </SectionCard>
              <SectionCard title="Sign-ins this week">
                <div className="flex flex-col gap-0.5">
                  <span className="text-heading-1 text-foreground">
                    {googleConnection.weeklySignIns}
                  </span>
                  <span className="text-caption text-fg-tertiary">
                    Across {usedBy.length} organizations · 0 failures
                  </span>
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={disabling}
        onOpenChange={setDisabling}
        icon={AlertIcon}
        title="Disable Google sign-in?"
        description={`Members of ${usedBy.join(" and ")} can’t continue with Google until it’s turned back on. They can still use email codes or their organization’s SSO.`}
        confirmLabel="Disable Google sign-in"
        onConfirm={feedback.notConnected}
      >
        <ConsequenceList
          items={[
            { title: `${usedBy.length} organizations use it`, detail: usedBy.join(" · ") },
            {
              title: "37 members signed in with Google this month",
              detail: "Their sessions keep working until they expire.",
            },
          ]}
        />
      </ConfirmDialog>
    </InstancePage>
  );
}
