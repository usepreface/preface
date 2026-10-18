import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";

import { Redacted } from "effect";

import { organizationBySlugAtom } from "#/atoms/organizations";
import { prefetchQuery } from "#/atoms/prefetch";
import { QueryState } from "#/components/api/query-state";
import { useResetAuthority } from "#/components/api/registry-provider";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { ReauthenticationLink } from "#/components/auth/reauthentication-link";
import { Notice } from "#/components/feedback/notice";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { recoveryForm } from "#/forms/authentication";
import { useOrganizationAuthRecoveryRecover } from "#/hooks/identity";
import { useReadiness } from "#/hooks/organizations";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

export const Route = createFileRoute("/org/$slug/auth-recovery")({
  beforeLoad: async ({ context, params, abortController }) => {
    const organization = await prefetchQuery(
      context.atomRegistry,
      organizationBySlugAtom(params.slug),
      abortController.signal,
    );
    if (!organization) throw notFound();
    return { organization };
  },
  component: Recovery,
});
function Recovery() {
  const { organization } = Route.useRouteContext();
  const readiness = useReadiness(organization.id);
  const recover = useOrganizationAuthRecoveryRecover();
  const router = useRouter();
  const resetAuthority = useResetAuthority();
  const form = useSchemaForm(recoveryForm, { defaultValues: { recoveryCredential: "" } });
  return (
    <AuthLayout>
      <AuthHeading title={`Recover ${organization.metadata.name}`}>
        An existing owner can make enterprise SSO optional using their offline credential and recent
        email proof.
      </AuthHeading>
      <Notice action={<ReauthenticationLink />}>
        Sign in by email and confirm it recently before recovery. The credential is consumed after
        success.
      </Notice>
      <QueryState query={readiness}>
        <form
          className="flex flex-col gap-5"
          onSubmit={form.handleSubmit(async (values) => {
            if (!readiness.data) return;
            const response = await recover.run({
              params: { organizationId: organization.id },
              payload: {
                expectedRevision: readiness.data.policyRevision,
                recoveryCredential: Redacted.value(values.recoveryCredential),
              },
            });
            if (response) {
              form.reset();
              resetAuthority();
              await router.navigate({ to: "/org/$slug", params: { slug: organization.slug } });
              await router.invalidate();
            }
          })}
        >
          <TextField
            control={form.control}
            name="recoveryCredential"
            label="Recovery credential"
            inputProps={{ type: "password", autoComplete: "off" }}
          />
          <SubmitButton pending={recover.pending}>Recover organization access</SubmitButton>
        </form>
      </QueryState>
      <Link to="/organizations">All organizations</Link>
    </AuthLayout>
  );
}
