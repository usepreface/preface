import { Link, useRouter } from "@tanstack/react-router";

import { Schema } from "effect";

import { VerificationId } from "@usepreface/protocol";
import { Button } from "@usepreface/ui/components/button";
import { MailIcon } from "@usepreface/ui/icons";

import { emailSignInVerifyMutation, reauthenticationVerifyEmailMutation } from "#/atoms/auth";
import { linkProof } from "#/atoms/transient";
import { useResetAuthority } from "#/components/api/registry-provider";
import { Notice } from "#/components/feedback/notice";
import { toMutation } from "#/hooks/mutation";

import { AuthHeading } from "./auth-layout";
import { StatusPage, StatusIcon } from "./status-page";

const useSignIn = toMutation(emailSignInVerifyMutation);
const useReauthenticate = toMutation(reauthenticationVerifyEmailMutation);
export function EmailLink({ reauthenticate = false }: { reauthenticate?: boolean }) {
  const signIn = useSignIn();
  const reauth = useReauthenticate();
  const router = useRouter();
  const resetAuthority = useResetAuthority();
  const { challengeId, token } = linkProof;
  return (
    <StatusPage>
      <StatusIcon icon={MailIcon} tone="accent" />
      <AuthHeading align="center" title={reauthenticate ? "Confirm your email" : "Confirm sign in"}>
        Continue in the browser where you requested this link.
      </AuthHeading>
      {Schema.is(VerificationId)(challengeId) && token ? (
        <Button
          size="lg"
          className="w-full"
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
    </StatusPage>
  );
}
