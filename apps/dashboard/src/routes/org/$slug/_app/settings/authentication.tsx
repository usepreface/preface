import { createFileRoute } from "@tanstack/react-router";

import { Redacted } from "effect";

import type { PublicOrganizationAuthPolicy } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import { Permission } from "#/components/api/permission";
import { QueryState } from "#/components/api/query-state";
import { ReauthenticationLink } from "#/components/auth/reauthentication-link";
import { Notice } from "#/components/feedback/notice";
import { ChoiceField } from "#/components/form/choice-field";
import { SelectField } from "#/components/form/select-field";
import { SubmitButton } from "#/components/form/submit-button";
import { SwitchField } from "#/components/form/switch-field";
import { TextField } from "#/components/form/text-field";
import { PageTitle, PageSection } from "#/components/shell/page";
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
    <SettingsFrame crumbs={[{ label: "Login policy" }]}>
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
      <SsoReadiness />
      <RecoverySettings />
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
      className="flex flex-col gap-5 rounded-xl border p-5"
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
      <PageSection title="Allowed methods">
        <p className="text-sm text-fg-secondary">
          Email codes and links always allow global sign-in. Required SSO still protects
          organization access for every member, including owners.
        </p>
        <SwitchField
          control={form.control}
          name="googleEnabled"
          title="Allow installation Google"
          description="Requires an active instance Google connection."
        />
      </PageSection>
      <QueryState query={connections}>
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
      </QueryState>
      <ChoiceField
        control={form.control}
        name="ssoMode"
        label="Enterprise SSO"
        options={[
          { value: "optional", label: "Optional" },
          { value: "required", label: "Required" },
        ]}
      />
      <SelectField
        control={form.control}
        name="ssoMaxAgeSeconds"
        label="Maximum SSO authentication age"
        options={reauthenticationIntervals}
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
      <Button type="button" variant="outline" onClick={version.reload}>
        Reload saved settings
      </Button>
      {version.conflicted ? (
        <p role="alert" className="text-sm text-warning-fg">
          Saved settings changed. Reload them before saving your edits.
        </p>
      ) : null}
      <SubmitButton pending={update.pending}>Save login policy</SubmitButton>
    </form>
  );
}
