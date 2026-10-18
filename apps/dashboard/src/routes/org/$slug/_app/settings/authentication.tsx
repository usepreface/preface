import * as React from "react";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Badge } from "@usepreface/ui/components/badge";
import { Button, buttonVariants } from "@usepreface/ui/components/button";
import { Label } from "@usepreface/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@usepreface/ui/components/select";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  KeyIcon,
  LockKeyIcon,
  MailIcon,
  RefreshIcon,
} from "@usepreface/ui/icons";
import { LogoTile } from "@usepreface/ui/preface/data-display";

import { DetailList } from "#/components/data-display/detail-list";
import { IconTile } from "#/components/data-display/icon-tile";
import { StatusBadge } from "#/components/data-display/status-badge";
import { Notice } from "#/components/feedback/notice";
import { ChoiceField } from "#/components/form/choice-field";
import { SaveBar } from "#/components/form/save-bar";
import { SelectField } from "#/components/form/select-field";
import { SwitchField, SwitchRow } from "#/components/form/switch-field";
import { PageTitle } from "#/components/shell/page";
import { SectionCard } from "#/components/shell/section-card";
import { loginPolicyForm, reauthenticationIntervals } from "#/forms/authentication";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { connections, organizationBySlug, type SsoConnection } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

import { ConnectionToggle } from "./-components/connection-toggle";
import { RecoveryCredentialDialog } from "./-components/recovery-credential-dialog";
import { SettingsFrame } from "./-components/settings-frame";
import { SsoReadinessDialog } from "./-components/sso-readiness-dialog";
export const Route = createFileRoute("/org/$slug/_app/settings/authentication")({
  head: () => ({ meta: [{ title: "Login policy · Settings · Preface" }] }),
  validateSearch: previewSearch,
  component: LoginPolicy,
});

const modes = [
  {
    value: "optional",
    label: "Optional",
    description: "Members can use any method above. Good while people move over.",
  },
  {
    value: "required",
    label: "Required",
    description: "Everyone except owners must use an approved SSO connection.",
  },
] as const;

const sensitive = [
  { value: "always", label: "Ask every time" },
  { value: "interval", label: "Follow the interval above" },
];

const selectable = connections.filter((connection) => connection.status !== "disabled");

const approved = (protocol: SsoConnection["protocol"]) =>
  connections
    .filter((connection) => connection.protocol === protocol && connection.approved)
    .map((connection) => connection.id);

/*
 * Which sign-in methods members can use, whether SSO is required, and how often people confirm
 * it's them. `?state=readiness` opens the checks before requiring SSO, `?state=recovery` the new
 * recovery credential, and `?state=required` an organization that already requires SSO.
 */
function LoginPolicy() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const state = previewState(["readiness", "recovery", "required"], Route.useSearch().state);
  const organization = organizationBySlug(slug);
  const required = state === "required";
  const [dialog, setDialog] = React.useState<"readiness" | "recovery" | null>(
    state === "readiness" || state === "recovery" ? state : null,
  );
  const hasCredential = state !== "readiness";

  const saved = {
    googleEnabled: !required,
    oidcConnectionIds: approved("oidc"),
    samlConnectionIds: approved("saml"),
    ssoMode: required ? ("required" as const) : ("optional" as const),
    ssoMaxAgeSeconds: 43200,
  };
  const form = useSchemaForm(loginPolicyForm, { defaultValues: saved });
  const mode = form.watch("ssoMode");

  const submit = form.handleSubmit((values) => {
    if (values.ssoMode === "required" && saved.ssoMode !== "required") {
      setDialog("readiness");
      return;
    }
    // Sign-in rules are a sensitive change: the API asks for a fresh check first.
    void navigate({ to: "/auth/reauthenticate" });
  });

  return (
    <SettingsFrame crumbs={[{ label: "Login policy" }]} width="full">
      <PageTitle
        title="Login policy"
        description={`Choose how people sign in to ${organization.name} and how often they confirm it’s them.`}
      />
      {required ? (
        <Notice tone="success" icon={CheckCircleIcon} title="Single sign-on is required">
          Everyone signs in through Okta. Owners can still recover with the recovery credential if
          Okta goes down.
        </Notice>
      ) : null}
      <form
        noValidate
        onSubmit={submit}
        className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <div className="flex flex-col gap-5">
          <SectionCard
            title="Sign-in methods"
            description="Members see only the methods turned on here."
          >
            <div className="flex flex-col">
              <SwitchRow
                media={<IconTile icon={MailIcon} />}
                title="Email code or magic link"
                badges={<Badge variant="outline">Owners always</Badge>}
                description={
                  mode === "required"
                    ? "Only owners, for recovery. Everyone else uses SSO."
                    : "Always on for owners. Anyone invited can use it."
                }
                checked
                disabled
              />
              <SwitchField
                control={form.control}
                name="googleEnabled"
                media={<LogoTile brand="google" size={36} />}
                title="Google"
                description="Uses the instance’s Google sign-in. Members must sign in with their invited email."
                disabled={mode === "required"}
              />
              <div className="flex flex-col gap-2 pt-3.5">
                <div className="flex items-center gap-3.5">
                  <IconTile icon={LockKeyIcon} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">Enterprise SSO</span>
                    <span className="text-13 text-fg-secondary">
                      Approve which tested connections members can use.
                    </span>
                  </div>
                  <Link
                    to="/org/$slug/settings/connections"
                    params={{ slug }}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Manage connections
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </div>
                {selectable.map((connection) => (
                  <ConnectionToggle key={connection.id} form={form} connection={connection} />
                ))}
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Require single sign-on">
            <ChoiceField
              control={form.control}
              name="ssoMode"
              label={<span className="sr-only">Single sign-on</span>}
              options={modes}
              columns={1}
            />
          </SectionCard>
          <div className="rounded-xl border bg-surface-1 px-6 py-4">
            <SaveBar
              dirty={form.formState.isDirty}
              pending={form.formState.isSubmitting}
              onReset={() => form.reset()}
              note="Saving asks you to confirm it’s you."
            />
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <SectionCard title="Re-authentication" description="How often members confirm it’s them.">
            <SelectField
              control={form.control}
              name="ssoMaxAgeSeconds"
              label="Sign in again every"
              options={reauthenticationIntervals}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sensitive-actions">Sensitive actions</Label>
              <Select items={sensitive} defaultValue="always">
                <SelectTrigger id="sensitive-actions" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sensitive.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-caption text-fg-tertiary">
                Changing sign-in rules, SSO or domains.
              </p>
            </div>
          </SectionCard>
          <SectionCard title="Recovery credential" description="For owners when SSO is down.">
            {hasCredential ? (
              <>
                <DetailList
                  labelWidth="w-20"
                  items={[
                    {
                      label: "Status",
                      value: (
                        <StatusBadge status={{ label: "Active", tone: "success", dot: true }} />
                      ),
                    },
                    { label: "Created", value: "Oct 18 · Aisha" },
                    { label: "Last used", value: "Never" },
                  ]}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDialog("recovery")}
                  >
                    <RefreshIcon data-icon="inline-start" />
                    Rotate
                  </Button>
                  <Button
                    type="button"
                    variant="destructive-outline"
                    size="sm"
                    onClick={feedback.notConnected}
                  >
                    Revoke
                  </Button>
                </div>
              </>
            ) : (
              <>
                <StatusBadge status={{ label: "Not set up", tone: "warning" }} />
                <p className="text-caption text-warning-fg">
                  No credential yet. You need one before requiring SSO.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="self-start"
                  onClick={() => setDialog("recovery")}
                >
                  <KeyIcon data-icon="inline-start" />
                  Generate credential
                </Button>
              </>
            )}
          </SectionCard>
        </div>
      </form>
      <SsoReadinessDialog
        open={dialog === "readiness"}
        onOpenChange={(open) => setDialog(open ? "readiness" : null)}
        onGenerateCredential={() => setDialog("recovery")}
        onRequire={() => navigate({ to: "/auth/reauthenticate" })}
      />
      <RecoveryCredentialDialog
        open={dialog === "recovery"}
        onOpenChange={(open) => setDialog(open ? "recovery" : null)}
      />
    </SettingsFrame>
  );
}
