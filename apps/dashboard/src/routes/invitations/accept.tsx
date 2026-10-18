import { useState } from "react";

import { createFileRoute, Link, useRouter } from "@tanstack/react-router";

import { Schema } from "effect";

import { OrganizationInvitationId, VerificationId } from "@usepreface/protocol";
import type { EmailSignInChallenge, InvitationPreview } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import {
  invitationsInspectMutation,
  invitationsRequestVerificationMutation,
  invitationsAcceptMutation,
  externalAuthenticationStartInvitationMutation,
} from "#/atoms/auth";
import { linkProof } from "#/atoms/transient";
import { useResetAuthority } from "#/components/api/registry-provider";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { OrDivider } from "#/components/auth/auth-parts";
import { StatusPage } from "#/components/auth/status-page";
import { VerifyCodeForm } from "#/components/auth/verify-code-form";
import { Notice } from "#/components/feedback/notice";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { acceptInvitationForm } from "#/forms/invitation";
import { toMutation } from "#/hooks/mutation";
import { useSignOut } from "#/hooks/session";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

import { InvitationAside, InvitationDetails } from "./-components/invitation-parts";

export const Route = createFileRoute("/invitations/accept")({ component: Invitation });
const useInspect = toMutation(invitationsInspectMutation);
const useRequest = toMutation(invitationsRequestVerificationMutation);
const useAccept = toMutation(invitationsAcceptMutation);
const useExternal = toMutation(externalAuthenticationStartInvitationMutation);
function Invitation() {
  const { actor } = Route.useRouteContext();
  const signOut = useSignOut();
  const { invitationId, token, challengeId, proofToken } = linkProof;
  const inspect = useInspect();
  const request = useRequest();
  const accept = useAccept();
  const external = useExternal();
  const [preview, setPreview] = useState<typeof InvitationPreview.Type>();
  const [challenge, setChallenge] = useState<EmailSignInChallenge>();
  const form = useSchemaForm(acceptInvitationForm, {
    defaultValues: { displayName: actor?.user.metadata.name ?? "" },
  });
  const router = useRouter();
  const resetAuthority = useResetAuthority();
  if (!Schema.is(OrganizationInvitationId)(invitationId) || !token)
    return (
      <StatusPage>
        <Notice tone="warning" title="Open your invitation link">
          Use the complete link in your invitation email.
        </Notice>
        <Link to="/sign-in">Sign in</Link>
      </StatusPage>
    );
  const credentials = { invitationId, token };
  return (
    <AuthLayout
      topRight={preview ? "Invitation" : undefined}
      aside={<InvitationAside preview={preview} />}
    >
      <AuthHeading title={preview ? `Join ${preview.organization.name}` : "Review your invitation"}>
        Verify your email or use an available identity provider to join.
      </AuthHeading>
      {actor ? (
        <Notice
          action={
            <Button
              variant="outline"
              size="sm"
              disabled={signOut.pending}
              onClick={() => void signOut.run("/invitations/accept")}
            >
              Use another account
            </Button>
          }
        >
          Signed in as {actor.user.email}. The invitation must match this account.
        </Notice>
      ) : null}
      {preview ? (
        <>
          <InvitationDetails preview={preview} />
          <form
            className="flex flex-col gap-5"
            onSubmit={form.handleSubmit(async () => {
              const response = await request.run({ payload: credentials });
              if (response) setChallenge(response.value);
            })}
          >
            <TextField
              control={form.control}
              name="displayName"
              label="Your display name"
              description="How teammates see you in Preface."
              size="lg"
              inputProps={{ autoComplete: "name" }}
            />
            {!challenge && !proofToken ? (
              <SubmitButton size="lg" wide pending={request.pending}>
                Email me a verification code
              </SubmitButton>
            ) : null}
          </form>
          {preview.methods.length ? <OrDivider /> : null}
          {preview.methods.map((method) => (
            <Button
              key={method.connectionId}
              variant="outline"
              size="lg"
              className="w-full"
              disabled={external.pending}
              onClick={form.handleSubmit(async ({ displayName }) => {
                const response = await external.run({
                  payload: {
                    ...credentials,
                    connectionId: method.connectionId,
                    displayName,
                    returnPath: "/organizations",
                  },
                });
                if (response) window.location.assign(response.value.authorizationUrl);
              })}
            >
              Continue with {method.name}
            </Button>
          ))}
          {challenge ? (
            <VerifyCodeForm
              expiresAt={challenge?.expiresAt}
              key={challenge?.challengeId}
              submitLabel="Accept invitation"
              pending={accept.pending}
              onVerified={async (code) => {
                if (!(await form.trigger())) return;
                const response = await accept.run({
                  payload: {
                    ...credentials,
                    displayName: form.getValues("displayName"),
                    challengeId: challenge.challengeId,
                    method: "code",
                    code,
                  },
                });
                if (response) {
                  delete linkProof.token;
                  delete linkProof.proofToken;
                  resetAuthority();
                  await router.navigate({ to: "/organizations" });
                  await router.invalidate();
                }
              }}
              onResend={async () => {
                const response = await request.run({ payload: credentials });
                if (response) setChallenge(response.value);
              }}
            />
          ) : null}
          {Schema.is(VerificationId)(challengeId) && proofToken ? (
            <Button
              disabled={accept.pending}
              onClick={form.handleSubmit(async ({ displayName }) => {
                const response = await accept.run({
                  payload: {
                    ...credentials,
                    displayName,
                    challengeId,
                    method: "magic_link",
                    proofToken,
                  },
                });
                if (response) {
                  delete linkProof.token;
                  delete linkProof.proofToken;
                  resetAuthority();
                  await router.navigate({ to: "/organizations" });
                  await router.invalidate();
                }
              })}
            >
              Verify email and accept invitation
            </Button>
          ) : null}
          {preview.ssoRequired ? (
            <Notice tone="info" title="Single sign-on required">
              Organization access requires enterprise SSO after joining.
            </Notice>
          ) : null}
        </>
      ) : (
        <Button
          disabled={inspect.pending}
          onClick={async () => {
            const response = await inspect.run({ payload: credentials });
            if (response) setPreview(response.value);
          }}
        >
          Review invitation
        </Button>
      )}
    </AuthLayout>
  );
}
