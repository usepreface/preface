import { useEffect, useState, type ReactNode } from "react";

import { DateTime, Redacted } from "effect";

import { Button } from "@usepreface/ui/components/button";

import { Notice } from "#/components/feedback/notice";
import { CodeField } from "#/components/form/code-field";
import { SubmitButton } from "#/components/form/submit-button";
import { verificationCodeForm, emptyCode } from "#/forms/verification";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

export function VerifyCodeForm({
  label = "Verification code",
  submitLabel,
  onVerified,
  onResend,
  pending,
  children,
  expiresAt,
  resendAt,
}: {
  label?: string;
  submitLabel: string;
  onVerified: (code: string) => void | Promise<void>;
  onResend?: () => void | Promise<void>;
  pending?: boolean;
  children?: ReactNode;
  expiresAt?: DateTime.Utc;
  resendAt?: DateTime.Utc;
}) {
  const form = useSchemaForm(verificationCodeForm, { defaultValues: emptyCode });
  const [resending, setResending] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!expiresAt && !resendAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, resendAt]);
  const expired = expiresAt !== undefined && DateTime.toEpochMillis(expiresAt) <= now;
  const resendSeconds = resendAt
    ? Math.max(0, Math.ceil((DateTime.toEpochMillis(resendAt) - now) / 1000))
    : 0;
  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={form.handleSubmit(async ({ code }) => {
        await onVerified(Redacted.value(code));
      })}
    >
      {expired ? (
        <Notice tone="warning">This code expired. Request a new code to continue.</Notice>
      ) : null}
      <CodeField control={form.control} name="code" label={label} disabled={pending || expired} />
      {onResend ? (
        <Button
          type="button"
          variant="ghost"
          disabled={resending || pending || resendSeconds > 0}
          onClick={async () => {
            setResending(true);
            try {
              await onResend();
            } finally {
              setResending(false);
            }
          }}
        >
          {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
        </Button>
      ) : null}
      {children}
      <SubmitButton
        size="lg"
        wide
        pending={pending || form.formState.isSubmitting}
        disabled={expired || form.watch("code").length !== 8}
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
