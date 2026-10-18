import { useState } from "react";

import { createFileRoute, Link, useRouter } from "@tanstack/react-router";

import { Schema } from "effect";

import type { EmailSignInChallenge } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import {
  reauthenticationRequestEmailMutation,
  reauthenticationResendEmailMutation,
  reauthenticationVerifyEmailMutation,
} from "#/atoms/auth";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { VerifyCodeForm } from "#/components/auth/verify-code-form";
import { toMutation } from "#/hooks/mutation";
import { safeReturnPath } from "#/lib/navigation";

export const Route = createFileRoute("/auth/reauthenticate")({
  validateSearch: Schema.decodeUnknownSync(
    Schema.Struct({ returnTo: Schema.optionalKey(Schema.String) }),
  ),
  component: Reauthenticate,
});
const useRequest = toMutation(reauthenticationRequestEmailMutation);
const useResend = toMutation(reauthenticationResendEmailMutation);
const useVerify = toMutation(reauthenticationVerifyEmailMutation);
function Reauthenticate() {
  const returnTo = safeReturnPath(
    Route.useSearch().returnTo ?? "/account/security",
    "/account/security",
  );
  const request = useRequest();
  const resend = useResend();
  const verify = useVerify();
  const [challenge, setChallenge] = useState<EmailSignInChallenge>();
  const router = useRouter();
  const { actor } = Route.useRouteContext();
  return (
    <AuthLayout>
      <AuthHeading title="Confirm it’s you">
        Sensitive changes need a recent email confirmation.
      </AuthHeading>
      {!actor ? (
        <Link to="/sign-in">Sign in again</Link>
      ) : !challenge ? (
        <Button
          disabled={request.pending}
          onClick={async () => {
            const response = await request.run({ payload: {} });
            if (response) setChallenge(response.value);
          }}
        >
          Send code to {actor.user.email}
        </Button>
      ) : (
        <VerifyCodeForm
          expiresAt={challenge?.expiresAt}
          key={challenge?.challengeId}
          submitLabel="Confirm email"
          pending={verify.pending}
          onVerified={async (code) => {
            const response = await verify.run({
              payload: { challengeId: challenge.challengeId, method: "code", code },
            });
            if (response) {
              await router.invalidate();
              await router.navigate({ to: returnTo });
            }
          }}
          onResend={async () => {
            const response = await resend.run({ payload: { challengeId: challenge.challengeId } });
            if (response) setChallenge(response.value);
          }}
        />
      )}
    </AuthLayout>
  );
}
