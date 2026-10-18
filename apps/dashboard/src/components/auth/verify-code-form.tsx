import * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { RefreshIcon } from "@usepreface/ui/icons";

import { Notice } from "#/components/feedback/notice";
import { CodeField } from "#/components/form/code-field";
import { SubmitButton } from "#/components/form/submit-button";
import { emptyCode, verificationCodeForm } from "#/forms/verification";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

import { ResendNotice } from "./auth-parts";

/** The states every code screen can be in, besides waiting for the code. */
export type CodeState = "incorrect" | "expired";

/*
 * The 8-digit email code used by setup, sign-in, external sign-in and re-authentication. The
 * button unlocks once all digits are in. `state` previews a wrong or expired code until the API
 * returns those errors.
 */
export function VerifyCodeForm({
  label = "Verification code",
  submitLabel,
  state,
  attemptsLeft = 4,
  resendIn = "0:42",
  expiredDetail = "Codes last 10 minutes. Send a new one to keep going.",
  arrow = true,
  onVerified,
  onResend,
  children,
}: {
  label?: string;
  submitLabel: string;
  state?: CodeState;
  attemptsLeft?: number;
  resendIn?: string;
  expiredDetail?: string;
  arrow?: boolean;
  onVerified?: () => void;
  onResend?: () => void;
  /** Rendered between the resend line and the submit button. */
  children?: React.ReactNode;
}) {
  const form = useSchemaForm(verificationCodeForm, {
    defaultValues: state ? { code: state === "incorrect" ? "48291763" : "48291736" } : emptyCode,
  });
  const code = form.watch("code");
  const { setError } = form;

  React.useEffect(() => {
    if (state === "incorrect") {
      setError("code", {
        message: `That code doesn’t match. Check the latest email and try again. ${attemptsLeft} attempts left.`,
      });
    }
  }, [state, attemptsLeft, setError]);

  const expired = state === "expired";

  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={form.handleSubmit(() => onVerified?.())}
    >
      {expired ? (
        <Notice tone="warning" title="This code has expired">
          {expiredDetail}
        </Notice>
      ) : null}
      <CodeField control={form.control} name="code" label={label} disabled={expired} />
      {expired ? (
        <p className="text-sm text-fg-tertiary">We’ll send a fresh code to the same address.</p>
      ) : (
        <ResendNotice
          remaining={state === "incorrect" ? undefined : resendIn}
          onResend={onResend}
        />
      )}
      {children}
      {expired ? (
        <Button type="button" size="lg" className="w-full" onClick={onResend}>
          <RefreshIcon data-icon="inline-start" />
          Send a new code
        </Button>
      ) : (
        <SubmitButton size="lg" wide arrow={arrow} disabled={code.length < 8}>
          {submitLabel}
        </SubmitButton>
      )}
    </form>
  );
}
