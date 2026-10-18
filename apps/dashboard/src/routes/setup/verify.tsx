import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";

import { useAtom } from "@effect/atom-react";

import {
  instanceSetupCompleteMutation,
  instanceSetupResendVerificationMutation,
} from "#/atoms/auth";
import { setupAtom } from "#/atoms/transient";
import { useResetAuthority } from "#/components/api/registry-provider";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { VerifyCodeForm } from "#/components/auth/verify-code-form";
import { Notice } from "#/components/feedback/notice";
import { toMutation } from "#/hooks/mutation";

import { setupSteps, VerifyAside } from "./-components/setup-asides";

export const Route = createFileRoute("/setup/verify")({ component: VerifyOwner });
const useComplete = toMutation(instanceSetupCompleteMutation);
const useResend = toMutation(instanceSetupResendVerificationMutation);
function VerifyOwner() {
  const [setup, setSetup] = useAtom(setupAtom);
  const complete = useComplete();
  const resend = useResend();
  const navigate = useNavigate();
  const router = useRouter();
  const resetAuthority = useResetAuthority();
  const challengeId = setup.challenge?.challengeId;
  return (
    <AuthLayout
      steps={{ labels: setupSteps, current: 2 }}
      topRight="Step 2 of 3"
      aside={<VerifyAside />}
    >
      <AuthHeading title="Check your email">
        Enter the 8-digit code sent to {setup.email}.
      </AuthHeading>
      {!setup.challenge || !setup.token ? (
        <Notice tone="warning">
          Reopen your operator link and start setup again. <Link to="/setup">Instance setup</Link>
        </Notice>
      ) : (
        <VerifyCodeForm
          key={setup.challenge?.challengeId}
          expiresAt={setup.challenge?.expiresAt}
          resendAt={setup.challenge?.resendAt}
          submitLabel="Verify email"
          pending={complete.pending}
          onVerified={async (code) => {
            if (!challengeId) return;
            const response = await complete.run({
              payload: { token: setup.token, challengeId, code },
            });
            if (!response) return;
            setSetup({ token: "", email: "" });
            resetAuthority();
            await navigate({ to: "/setup/organization" });
            await router.invalidate();
          }}
          onResend={async () => {
            if (!challengeId) return;
            const response = await resend.run({
              payload: { token: setup.token, challengeId },
            });
            if (response) setSetup({ ...setup, challenge: response.value });
          }}
        />
      )}
    </AuthLayout>
  );
}
