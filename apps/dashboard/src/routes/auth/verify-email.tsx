import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Schema } from "effect";

import { AuthFlowId } from "@usepreface/protocol";
import type { EmailSignInChallenge } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import {
  externalAuthenticationRequestEmailMutation,
  externalAuthenticationVerifyEmailMutation,
  externalAuthenticationResumeMutation,
} from "#/atoms/auth";
import { ApiClient } from "#/atoms/client";
import { QueryState } from "#/components/api/query-state";
import { useResetAuthority } from "#/components/api/registry-provider";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { VerifyCodeForm } from "#/components/auth/verify-code-form";
import { toMutation } from "#/hooks/mutation";
import { toQuery } from "#/hooks/query";
import { safeReturnPath } from "#/lib/navigation";
import { requestFields } from "#/lib/request-fields";

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: Schema.decodeUnknownSync(Schema.Struct({ flowId: AuthFlowId })),
  component: ExternalEmail,
});
const useFlow = toQuery((flowId: AuthFlowId) =>
  ApiClient.query("externalAuthentication", "status", requestFields({ params: { flowId } })),
);
const useRequest = toMutation(externalAuthenticationRequestEmailMutation);
const useVerify = toMutation(externalAuthenticationVerifyEmailMutation);
const useResume = toMutation(externalAuthenticationResumeMutation);
function ExternalEmail() {
  const { flowId } = Route.useSearch();
  const flow = useFlow(flowId);
  const request = useRequest();
  const verify = useVerify();
  const resume = useResume();
  const [challenge, setChallenge] = useState<EmailSignInChallenge>();
  const resetAuthority = useResetAuthority();
  async function finish(redirectTo: string) {
    resetAuthority();
    // Completion destinations are trusted backend output, still constrained to this dashboard.
    window.location.assign(safeReturnPath(redirectTo));
  }
  return (
    <AuthLayout>
      <AuthHeading title="Verify your email">
        Confirm mailbox ownership to finish linking your identity.
      </AuthHeading>
      <QueryState query={flow}>
        <p className="text-sm text-fg-secondary">{flow.data?.maskedEmail}</p>
        {flow.data?.nextAction === "continue" ? (
          <Button
            disabled={resume.pending}
            onClick={async () => {
              const response = await resume.run({ params: { flowId }, payload: {} });
              if (response) await finish(response.value.redirectTo);
            }}
          >
            Finish sign-in
          </Button>
        ) : challenge ? (
          <VerifyCodeForm
            expiresAt={challenge?.expiresAt}
            key={challenge?.challengeId}
            submitLabel="Verify and continue"
            pending={verify.pending}
            onVerified={async (code) => {
              const response = await verify.run({
                params: { flowId },
                payload: { challengeId: challenge.challengeId, code },
              });
              if (response) await finish(response.value.redirectTo);
            }}
            onResend={async () => {
              const response = await request.run({ params: { flowId }, payload: {} });
              if (response) setChallenge(response.value);
            }}
          />
        ) : (
          <Button
            disabled={request.pending}
            onClick={async () => {
              const response = await request.run({ params: { flowId }, payload: {} });
              if (response) setChallenge(response.value);
            }}
          >
            Email me a code
          </Button>
        )}
      </QueryState>
    </AuthLayout>
  );
}
