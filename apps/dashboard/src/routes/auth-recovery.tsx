import { createFileRoute, Link, useRouter } from "@tanstack/react-router";

import { Redacted } from "effect";

import { KeyIcon } from "@usepreface/ui/icons";

import { QueryState } from "#/components/api/query-state";
import { useResetAuthority } from "#/components/api/registry-provider";
import { AuthHeading } from "#/components/auth/auth-layout";
import { StatusPage, StatusIcon } from "#/components/auth/status-page";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { recoveryForm } from "#/forms/authentication";
import { useOrganizationAuthRecoveryRecover } from "#/hooks/identity";
import { useReadiness } from "#/hooks/organizations";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

export const Route = createFileRoute("/auth-recovery")({ component: Recovery });
function Recovery() {
  const { instance } = Route.useRouteContext();
  const readiness = useReadiness();
  const recover = useOrganizationAuthRecoveryRecover();
  const router = useRouter();
  const resetAuthority = useResetAuthority();
  const form = useSchemaForm(recoveryForm, { defaultValues: { recoveryCredential: "" } });
  return (
    <StatusPage width="lg">
      <StatusIcon icon={KeyIcon} tone="warning" />
      <AuthHeading align="center" title={`Recover ${instance.organizationName}`}>
        An existing owner can make enterprise SSO optional using their offline credential.
      </AuthHeading>
      <QueryState query={readiness}>
        <form
          className="flex w-full flex-col gap-5 text-left"
          onSubmit={form.handleSubmit(async (values) => {
            if (!readiness.data) return;
            const response = await recover.run({
              payload: {
                expectedRevision: readiness.data.policyRevision,
                recoveryCredential: Redacted.value(values.recoveryCredential),
              },
            });
            if (response) {
              form.reset();
              resetAuthority();
              await router.navigate({ to: "/" });
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
      <Link to="/">Back to dashboard</Link>
    </StatusPage>
  );
}
