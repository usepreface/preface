import { createFileRoute, Link } from "@tanstack/react-router";

import { Redacted } from "effect";

import type { PublicOrganizationAuthPolicy } from "@usepreface/protocol/dto";
import { Badge } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { MailIcon, LockKeyIcon } from "@usepreface/ui/icons";
import { LogoTile } from "@usepreface/ui/preface/data-display";

import { Permission } from "#/components/api/permission";
import { QueryState } from "#/components/api/query-state";
import { ReauthenticationLink } from "#/components/auth/reauthentication-link";
import { IconTile } from "#/components/data-display/icon-tile";
import { Notice } from "#/components/feedback/notice";
import { ChoiceField } from "#/components/form/choice-field";
import { SaveBar } from "#/components/form/save-bar";
import { SelectField } from "#/components/form/select-field";
import { SwitchField, SwitchRow } from "#/components/form/switch-field";
import { TextField } from "#/components/form/text-field";
import { PageTitle } from "#/components/shell/page";
import { SectionCard } from "#/components/shell/section-card";
import { updateLoginPolicyForm, reauthenticationIntervals } from "#/forms/authentication";
import { useAuthenticationPolicyUpdate } from "#/hooks/identity";
import { useOrganization, usePolicy, useConnections } from "#/hooks/organizations";
import { feedback } from "#/lib/feedback";
import { useRevisionForm } from "#/lib/forms/use-revision-form";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

import { RecoverySettings } from "./-components/recovery-settings";
import { SettingsFrame } from "./-components/settings-frame";
import { SsoReadiness } from "./-components/sso-readiness";

export const Route = createFileRoute("/org/$slug/_app/settings/authentication")({
  component: () => (
    <Permission owner>
      <LoginPolicy />
    </Permission>
  ),
});
function LoginPolicy() {
  const { organization } = useOrganization();
  const policy = usePolicy(organization.id);
  return (
    <SettingsFrame crumbs={[{ label: "Login policy" }]} width="full">
      <PageTitle
        title="Login policy"
        description="Choose approved providers and organization SSO requirements."
      />
      <Notice action={<ReauthenticationLink />}>
        Policy changes require email confirmation within the last five minutes. Requiring SSO also
        needs recent provider authentication.
      </Notice>
      <QueryState query={policy}>
        {policy.data ? <PolicyForm policy={policy.data} /> : null}
      </QueryState>
    </SettingsFrame>
  );
}
function PolicyForm({ policy }: { policy: PublicOrganizationAuthPolicy }) {
  const { organization } = useOrganization();
  const connections = useConnections(organization.id);
  const update = useAuthenticationPolicyUpdate();
  const savedValues = {
    googleEnabled: policy.allowedMethods.includes("google"),
    oidcConnectionIds: [...(policy.oidcConnectionIds ?? [])],
    samlConnectionIds: [...(policy.samlConnectionIds ?? [])],
    ssoMode: policy.ssoMode,
    ssoMaxAgeSeconds: policy.ssoMaxAgeSeconds,
  };
  const form = useSchemaForm(updateLoginPolicyForm, {
    defaultValues: savedValues,
  });
  const version = useRevisionForm(form, policy.revision, savedValues);
  return (
    <form
      className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]"
      onSubmit={form.handleSubmit(async (values) => {
        const response = await update.run({
          params: { organizationId: organization.id },
          payload: {
            ...values,
            expectedRevision: version.revision,
            recoveryCredential: values.recoveryCredential
              ? Redacted.value(values.recoveryCredential)
              : undefined,
          },
        });
        if (response) {
          version.accept(response.value.revision, {
            ...form.getValues(),
            recoveryCredential: undefined,
          });
          feedback.saved("Login policy");
        }
      })}
    >
      <div className="flex flex-col gap-5">
        <SectionCard
          title="Sign-in methods"
          description="Choose the providers members may use to open this organization."
        >
          <SwitchRow
            media={<IconTile icon={MailIcon} />}
            title="Email code or magic link"
            badges={<Badge variant="outline">Instance sign-in</Badge>}
            description="Email signs you in to the instance. Required SSO still protects organization access for every member, including owners."
            checked
            disabled
          />
          <SwitchField
            control={form.control}
            name="googleEnabled"
            title="Google"
            media={<LogoTile brand="google" size={36} />}
            description="Requires an active instance Google connection."
          />

          <div className="flex items-center gap-3.5 pt-3.5">
            <IconTile icon={LockKeyIcon} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Enterprise SSO</span>
              <span className="text-13 text-fg-secondary">
                Approve which tested connections members can use.
              </span>
            </div>
            <Link
              to="/org/$slug/settings/connections"
              params={{ slug: organization.slug }}
              className="text-sm font-medium text-fg-accent"
            >
              Manage connections
            </Link>
          </div>
          <QueryState query={connections}>
            {connections.data?.connections.some((connection) => connection.provider === "oidc") ? (
              <ChoiceField
                control={form.control}
                name="oidcConnectionIds"
                label="Approved OIDC connections"
                multiple
                columns={1}
                options={(connections.data?.connections ?? [])
                  .filter((connection) => connection.provider === "oidc")
                  .map((connection) => ({
                    value: connection.id,
                    label: connection.name,
                    description: connection.status,
                    disabled:
                      connection.status !== "active" &&
                      !form.getValues("oidcConnectionIds")?.includes(connection.id),
                  }))}
              />
            ) : null}
            {connections.data?.connections.some((connection) => connection.provider === "saml") ? (
              <ChoiceField
                control={form.control}
                name="samlConnectionIds"
                label="Approved SAML connections"
                multiple
                columns={1}
                options={(connections.data?.connections ?? [])
                  .filter((connection) => connection.provider === "saml")
                  .map((connection) => ({
                    value: connection.id,
                    label: connection.name,
                    description: connection.status,
                    disabled:
                      connection.status !== "active" &&
                      !form.getValues("samlConnectionIds")?.includes(connection.id),
                  }))}
              />
            ) : null}
          </QueryState>
        </SectionCard>
        <SectionCard title="Require single sign-on">
          <ChoiceField
            control={form.control}
            name="ssoMode"
            label="Enterprise SSO"
            columns={1}
            options={[
              {
                value: "optional",
                label: "Optional",
                description:
                  "Members can use any approved method above. Good while people move over.",
              },
              {
                value: "required",
                label: "Required",
                description: "Every member, including owners, must use an approved SSO connection.",
              },
            ]}
          />
          {form.watch("ssoMode") === "required" ? (
            <TextField
              control={form.control}
              name="recoveryCredential"
              label="Offline recovery credential"
              optional
              emptyAsUndefined
              inputProps={{ type: "password", autoComplete: "off" }}
              description="Required when enabling SSO. It is checked without being consumed."
            />
          ) : null}
        </SectionCard>
        <div className="rounded-xl border bg-surface-1 px-6 py-4">
          {version.conflicted ? (
            <Button type="button" variant="outline" onClick={version.reload}>
              Reload saved settings
            </Button>
          ) : null}
          {version.conflicted ? (
            <p role="alert" className="text-sm text-warning-fg">
              Saved settings changed. Reload them before saving your edits.
            </p>
          ) : null}
          <SaveBar
            dirty={form.formState.isDirty}
            pending={update.pending}
            onReset={version.reload}
            saveLabel="Save login policy"
            note="Saving requires a recent email confirmation."
          />
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <SectionCard title="Re-authentication" description="How often members confirm it’s them.">
          <SelectField
            control={form.control}
            name="ssoMaxAgeSeconds"
            label="Maximum SSO authentication age"
            options={reauthenticationIntervals}
          />
          <p className="text-caption text-fg-tertiary">
            Sensitive configuration changes require a fresh email confirmation within five minutes.
          </p>
        </SectionCard>
        <RecoverySettings />
        <SsoReadiness />
      </div>
    </form>
  );
}
