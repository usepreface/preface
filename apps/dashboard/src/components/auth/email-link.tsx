import { Link, useRouter } from "@tanstack/react-router";

import { Schema } from "effect";

import { VerificationId } from "@usepreface/protocol";
import { Button } from "@usepreface/ui/components/button";

import { emailSignInVerifyMutation, reauthenticationVerifyEmailMutation } from "#/atoms/auth";
import { linkProof } from "#/atoms/transient";
import { useResetAuthority } from "#/components/api/registry-provider";
import { Notice } from "#/components/feedback/notice";
import { toMutation } from "#/hooks/mutation";

import { AuthHeading, AuthLayout } from "./auth-layout";

const useSignIn = toMutation(emailSignInVerifyMutation);
const useReauthenticate = toMutation(reauthenticationVerifyEmailMutation);
export function EmailLink({ reauthenticate = false }: { reauthenticate?: boolean }) {
  const signIn = useSignIn();
  const reauth = useReauthenticate();
  const router = useRouter();
  const resetAuthority = useResetAuthority();
  const { challengeId, token } = linkProof;
  return (
    <AuthLayout>
      <AuthHeading title="Confirm your email">
        Continue in the browser where you requested this link.
      </AuthHeading>
      {Schema.is(VerificationId)(challengeId) && token ? (
        <Button
          size="lg"
          disabled={signIn.pending || reauth.pending}
          onClick={async () => {
            const payload = { challengeId, token, method: "magic_link" as const };
            const response = reauthenticate
              ? await reauth.run({ payload })
              : await signIn.run({ payload });
            if (!response) return;
            delete linkProof.token;
            resetAuthority();
            await router.navigate({ to: reauthenticate ? "/account/security" : "/organizations" });
            await router.invalidate();
          }}
        >
          Continue
        </Button>
      ) : (
        <Notice tone="warning">
          This link is missing its proof. Open the link in your latest email again.
        </Notice>
      )}
      <Link to="/sign-in">Back to sign in</Link>
    </AuthLayout>
  );
}
