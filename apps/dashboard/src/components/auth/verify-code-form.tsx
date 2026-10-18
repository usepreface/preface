import { useEffect, useState, type ReactNode } from "react";

import { DateTime, Redacted } from "effect";

import { Button } from "@usepreface/ui/components/button";

import { Notice } from "#/components/feedback/notice";
import { CodeField } from "#/components/form/code-field";
import { SubmitButton } from "#/components/form/submit-button";
import { verificationCodeForm, emptyCode } from "#/forms/verification";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

import { ResendNotice } from "./auth-parts";

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

  async function resendCode() {
    if (!onResend || resending || pending || resendSeconds > 0) return;
    setResending(true);
    try {
      await onResend();
    } finally {
      setResending(false);
    }
  }

  return (
    <form
      className="flex w-full flex-col gap-5 text-left"
      noValidate
      onSubmit={form.handleSubmit(async ({ code }) => {
        await onVerified(Redacted.value(code));
      })}
    >
      {expired ? (
        <Notice tone="warning">This code expired. Request a new code to continue.</Notice>
      ) : null}
      <CodeField control={form.control} name="code" label={label} disabled={pending || expired} />
      {onResend && expired ? (
        <Button
          type="button"
          disabled={resending || pending || resendSeconds > 0}
          size="lg"
          onClick={() => void resendCode()}
        >
          Send a new code
        </Button>
      ) : onResend ? (
        <ResendNotice
          remaining={
            resendSeconds > 0
              ? `${Math.floor(resendSeconds / 60)}:${String(resendSeconds % 60).padStart(2, "0")}`
              : undefined
          }
          disabled={resending || pending}
          onResend={() => void resendCode()}
        />
      ) : null}
      {children}
      {!expired ? (
        <SubmitButton
          size="lg"
          wide
          arrow
          pending={pending || form.formState.isSubmitting}
          disabled={expired || form.watch("code").length !== 8}
        >
          {submitLabel}
        </SubmitButton>
      ) : null}
    </form>
  );
}
