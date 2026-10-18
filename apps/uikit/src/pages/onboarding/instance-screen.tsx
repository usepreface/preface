import * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { Input } from "@usepreface/ui/components/input";
import {
  ArrowRightIcon,
  BrainIcon,
  ServerIcon,
  ShieldIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import { SelfHostedIllustration } from "@usepreface/ui/illustrations";
import { FieldHint, PasswordInput, PasswordStrength } from "@usepreface/ui/preface/account-fields";

import { AuthLayout, FormHeading, FormField, formInputClassName } from "./layout";

export type Owner = { instance: string; name: string; email: string };

export function InstanceScreen({
  owner,
  mismatch,
  onDone,
}: {
  owner: Owner;
  mismatch: boolean;
  onDone: (o: Owner) => void;
}) {
  const [values, setValues] = React.useState(owner);
  const [password, setPassword] = React.useState("Halcyon-Tide-58!");
  const [confirm, setConfirm] = React.useState(mismatch ? "Halcyon-Tide-85!" : "Halcyon-Tide-58!");
  const [submitted, setSubmitted] = React.useState(mismatch);
  const matches = confirm.length > 0 && confirm === password;
  const showMismatch =
    (submitted || confirm.length >= password.length) && !matches && Boolean(confirm);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
  const ready =
    values.instance.trim() && values.name.trim() && emailOk && password.length >= 12 && matches;

  return (
    <AuthLayout
      step={1}
      aside={
        <>
          <SelfHostedIllustration className="h-72 w-auto" />
          <div className="flex max-w-100 flex-col items-center gap-2 text-center">
            <h2 className="text-heading-3">Your knowledge, on your servers</h2>
            <p className="text-sm text-fg-secondary">
              This instance runs on infrastructure you control. You’re the owner: you can add admins
              and organizations later.
            </p>
          </div>
          <Points
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
      <FormHeading title="Set up your instance">
        Name this Preface instance and create the owner account. It takes under a minute.
      </FormHeading>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (ready) {
            onDone(values);
          }
        }}
      >
        <FormField
          id="instance-name"
          label="Instance name"
          hints={<FieldHint>Shown on the sign-in page and in emails.</FieldHint>}
        >
          <Input
            id="instance-name"
            className={formInputClassName}
            value={values.instance}
            onChange={(e) => setValues((v) => ({ ...v, instance: e.target.value }))}
            required
          />
        </FormField>
        <div className="flex flex-col gap-3 sm:flex-row">
          <FormField id="owner-name" label="Owner name">
            <Input
              id="owner-name"
              className={formInputClassName}
              autoComplete="name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              required
            />
          </FormField>
          <FormField
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
              className={formInputClassName}
              autoComplete="email"
              value={values.email}
              aria-invalid={submitted && !emailOk ? true : undefined}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              required
            />
          </FormField>
        </div>
        <FormField id="password" label="Password" hints={<PasswordStrength value={password} />}>
          <PasswordInput
            id="password"
            value={password}
            defaultVisible={mismatch}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>
        <FormField
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
            defaultVisible={mismatch}
            aria-invalid={showMismatch || undefined}
            aria-describedby="confirm-hint"
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </FormField>
        <Button type="submit" size="lg" className="h-10 w-full">
          Create instance
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
        <p className="text-xs text-fg-tertiary">
          You can change the instance name in Settings. The owner can’t be removed, only
          transferred.
        </p>
      </form>
    </AuthLayout>
  );
}

function Points({ items }: { items: [IconComponent, string, string][] }) {
  return (
    <ul className="flex w-full max-w-100 flex-col gap-3.5">
      {items.map(([Icon, title, text]) => (
        <li key={title} className="flex gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-1">
            <Icon className="size-4 text-icon-accent" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{title}</span>
            <span className="text-xs text-fg-secondary">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
