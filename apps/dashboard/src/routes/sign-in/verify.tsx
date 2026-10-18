import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";

import { useAtom } from "@effect/atom-react";

import { LinkIcon } from "@usepreface/ui/icons";

import { emailSignInVerifyMutation, emailSignInResendMutation } from "#/atoms/auth";
import { signInAtom } from "#/atoms/transient";
import { useResetAuthority } from "#/components/api/registry-provider";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { EmailRecipient } from "#/components/auth/auth-parts";
import { VerifyCodeForm } from "#/components/auth/verify-code-form";
import { Notice } from "#/components/feedback/notice";
import { toMutation } from "#/hooks/mutation";

import { CodeAside } from "./-components/sign-in-asides";

export const Route = createFileRoute("/sign-in/verify")({ component: VerifySignIn });
const useVerify = toMutation(emailSignInVerifyMutation);
const useResend = toMutation(emailSignInResendMutation);
function VerifySignIn() {
  const [signIn, setSignIn] = useAtom(signInAtom);
  const verify = useVerify();
  const resend = useResend();
  const router = useRouter();
  const navigate = useNavigate();
  const { instance } = Route.useRouteContext();
  const resetAuthority = useResetAuthority();
  const challengeId = signIn.challenge?.challengeId;
  return (
    <AuthLayout topRight={instance.instanceName} aside={<CodeAside />}>
      <AuthHeading title="Enter the code we emailed">
        If {signIn.email || "your email"} has access, a code and sign-in link are on their way.
      </AuthHeading>
      {signIn.challenge ? (
        <>
          <EmailRecipient email={signIn.email} onAction={() => void navigate({ to: "/sign-in" })} />
          <VerifyCodeForm
            key={signIn.challenge?.challengeId}
            label="Sign-in code"
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
          <Notice tone="neutral" icon={LinkIcon} title="Prefer the link?">
            The email also has a sign-in link. Open it in this browser to continue without typing a
            code.
          </Notice>
        </>
      ) : (
        <Notice tone="warning">
          Start sign-in again to request a code. <Link to="/sign-in">Back to sign in</Link>
        </Notice>
      )}
    </AuthLayout>
  );
}
