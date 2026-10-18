import { createFileRoute, Link, useRouter } from "@tanstack/react-router";

import { useAtom } from "@effect/atom-react";

import { emailSignInVerifyMutation, emailSignInResendMutation } from "#/atoms/auth";
import { signInAtom } from "#/atoms/transient";
import { useResetAuthority } from "#/components/api/registry-provider";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { VerifyCodeForm } from "#/components/auth/verify-code-form";
import { Notice } from "#/components/feedback/notice";
import { toMutation } from "#/hooks/mutation";

import { SignInAside } from "./-components/sign-in-asides";

export const Route = createFileRoute("/sign-in/verify")({ component: VerifySignIn });
const useVerify = toMutation(emailSignInVerifyMutation);
const useResend = toMutation(emailSignInResendMutation);
function VerifySignIn() {
  const [signIn, setSignIn] = useAtom(signInAtom);
  const verify = useVerify();
  const resend = useResend();
  const router = useRouter();
  const resetAuthority = useResetAuthority();
  const challengeId = signIn.challenge?.challengeId;
  return (
    <AuthLayout aside={<SignInAside />}>
      <AuthHeading title="Check your email">
        If {signIn.email || "your email"} has access, a code and sign-in link are on their way.
      </AuthHeading>
      {signIn.challenge ? (
        <VerifyCodeForm
          key={signIn.challenge?.challengeId}
          expiresAt={signIn.challenge?.expiresAt}
          submitLabel="Sign in"
          pending={verify.pending}
          onVerified={async (code) => {
            if (!challengeId) return;
            const response = await verify.run({
              payload: { challengeId, method: "code", code },
            });
            if (!response) return;
            setSignIn({ email: "" });
            resetAuthority();
            await router.navigate({ to: "/organizations" });
            await router.invalidate();
          }}
          onResend={async () => {
            if (!challengeId) return;
            const response = await resend.run({
              payload: { challengeId },
            });
            if (response) setSignIn({ ...signIn, challenge: response.value });
          }}
        />
      ) : (
        <Notice tone="warning">
          Start sign-in again to request a code. <Link to="/sign-in">Back to sign in</Link>
        </Notice>
      )}
    </AuthLayout>
  );
}
