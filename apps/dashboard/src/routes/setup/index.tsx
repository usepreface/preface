import * as React from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { Input } from "@usepreface/ui/components/input";
import { ArrowRightIcon, BrainIcon, ServerIcon, ShieldIcon } from "@usepreface/ui/icons";
import { SelfHostedIllustration } from "@usepreface/ui/illustrations";
import { FieldHint, PasswordInput, PasswordStrength } from "@usepreface/ui/preface/account-fields";

import { placeholder } from "../../lib/placeholder";
import { AsidePoints } from "./-components/aside-points";
import { SetupField, SetupHeading, SetupLayout, largeInput } from "./-components/setup-layout";

export const Route = createFileRoute("/setup/")({
  head: () => ({ meta: [{ title: "Set up your instance · Preface" }] }),
  component: InstanceSetup,
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 12;

/*
 * Step 1, Figma "Set up instance" and "Instance error". Validation is client-side only: nothing
 * is sent anywhere yet, submitting moves on to step 2.
 */
function InstanceSetup() {
  const navigate = useNavigate();
  const [values, setValues] = React.useState({ instance: "", name: "", email: "" });
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const emailOk = EMAIL.test(values.email);
  const passwordOk = password.length >= MIN_PASSWORD;
  const matches = confirm.length > 0 && confirm === password;
  const showMismatch =
    confirm.length > 0 && !matches && (submitted || confirm.length >= password.length);
  const ready = values.instance.trim() && values.name.trim() && emailOk && passwordOk && matches;

  return (
    <SetupLayout
      step={1}
      aside={
        <>
          <SelfHostedIllustration className="h-72 w-auto" />
          <div className="flex max-w-100 flex-col items-center gap-2 text-center">
            <h2 className="text-heading-3 text-foreground">Your knowledge, on your servers</h2>
            <p className="text-sm text-fg-secondary">
              This instance runs on infrastructure you control. You’re the owner: you can add admins
              and organizations later.
            </p>
          </div>
          <AsidePoints
            items={[
              [
                ServerIcon,
                "Data stays in your network",
                "Documents, embeddings and logs never leave this instance.",
              ],
              [BrainIcon, "Bring your own models", "OpenAI, Anthropic, Azure, Bedrock or Ollama."],
              [
                ShieldIcon,
                "Owner account first",
                "SSO and SCIM can take over once you connect your IdP.",
              ],
            ]}
          />
        </>
      }
    >
      <SetupHeading title="Set up your instance">
        Name this Preface instance and create the owner account. It takes under a minute.
      </SetupHeading>
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (ready) {
            void navigate({ to: "/setup/organization" });
          }
        }}
      >
        <SetupField
          id="instance-name"
          label="Instance name"
          hints={
            submitted && !values.instance.trim() ? (
              <FieldHint tone="danger">Give the instance a name.</FieldHint>
            ) : (
              <FieldHint>Shown on the sign-in page and in emails.</FieldHint>
            )
          }
        >
          <Input
            id="instance-name"
            className={largeInput}
            placeholder={placeholder.instance.name}
            value={values.instance}
            aria-invalid={(submitted && !values.instance.trim()) || undefined}
            onChange={set("instance")}
            autoFocus
            required
          />
        </SetupField>
        <div className="flex flex-col gap-5 sm:flex-row sm:gap-3">
          <SetupField
            id="owner-name"
            label="Owner name"
            hints={
              submitted && !values.name.trim() ? (
                <FieldHint tone="danger">Enter your name.</FieldHint>
              ) : null
            }
          >
            <Input
              id="owner-name"
              className={largeInput}
              autoComplete="name"
              placeholder={placeholder.owner.name}
              value={values.name}
              aria-invalid={(submitted && !values.name.trim()) || undefined}
              onChange={set("name")}
              required
            />
          </SetupField>
          <SetupField
            id="owner-email"
            label="Email"
            hints={
              submitted && !emailOk ? (
                <FieldHint tone="danger">Enter an email like name@company.com.</FieldHint>
              ) : null
            }
          >
            <Input
              id="owner-email"
              type="email"
              className={largeInput}
              autoComplete="email"
              placeholder={placeholder.owner.email}
              value={values.email}
              aria-invalid={(submitted && !emailOk) || undefined}
              onChange={set("email")}
              required
            />
          </SetupField>
        </div>
        <SetupField
          id="password"
          label="Password"
          hints={
            password ? (
              <PasswordStrength value={password} />
            ) : (
              <FieldHint tone={submitted ? "danger" : "neutral"}>
                At least {MIN_PASSWORD} characters.
              </FieldHint>
            )
          }
        >
          <PasswordInput
            id="password"
            value={password}
            placeholder="••••••••••••"
            aria-invalid={(submitted && !passwordOk) || undefined}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </SetupField>
        <SetupField
          id="confirm"
          label="Confirm password"
          hints={
            showMismatch ? (
              <FieldHint tone="danger" id="confirm-hint">
                Passwords don’t match. Check the last characters.
              </FieldHint>
            ) : matches ? (
              <FieldHint tone="success" id="confirm-hint">
                Passwords match
              </FieldHint>
            ) : null
          }
        >
          <PasswordInput
            id="confirm"
            value={confirm}
            placeholder="••••••••••••"
            aria-invalid={showMismatch || (submitted && !matches) || undefined}
            aria-describedby="confirm-hint"
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </SetupField>
        <Button type="submit" size="lg" className="group h-10 w-full">
          Create instance
          <ArrowRightIcon
            data-icon="inline-end"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Button>
        <p className="text-xs text-fg-tertiary">
          You can change the instance name in Settings. The owner can’t be removed, only
          transferred.
        </p>
      </form>
    </SetupLayout>
  );
}
