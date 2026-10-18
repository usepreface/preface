import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { CheckCircleIcon } from "@usepreface/ui/icons";

import { QueryState } from "#/components/api/query-state";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { Notice } from "#/components/feedback/notice";
import { SubmitButton } from "#/components/form/submit-button";
import { createOrganizationForm } from "#/forms/organization";
import { useCreateOrganization } from "#/hooks/organizations";
import { useCapabilities, usePerson } from "#/hooks/session";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { setupSteps } from "#/routes/setup/-components/setup-asides";

import { OrgPreviewAside } from "./org-preview";
import { OrganizationFields } from "./organization-fields";
import { SetupComplete } from "./setup-complete";

export function CreateOrganization({ first = false }: { first?: boolean }) {
  const form = useSchemaForm(createOrganizationForm, {
    defaultValues: { metadata: { name: "", description: "" }, slug: "" },
  });
  const create = useCreateOrganization();
  const capabilities = useCapabilities();
  const navigate = useNavigate();
  const person = usePerson();
  const [created, setCreated] = useState<{ name: string; slug: string }>();

  if (created) return <SetupComplete name={created.name} slug={created.slug} />;
  return (
    <AuthLayout
      steps={first ? { labels: setupSteps, current: 3 } : undefined}
      topRight={first ? "Step 3 of 3" : <Link to="/organizations">Cancel</Link>}
      aside={<OrgPreviewAside name={form.watch("metadata.name")} slug={form.watch("slug")} />}
    >
      {first ? (
        <Notice tone="success" icon={CheckCircleIcon}>
          Email verified. Signed in as {person.email}.
        </Notice>
      ) : (
        <Link to="/organizations" className="text-sm text-fg-secondary">
          All organizations
        </Link>
      )}
      <AuthHeading title={first ? "Create your first organization" : "New organization"}>
        Organizations hold sources, members, teams and sign-in rules. Most companies need just one.
      </AuthHeading>
      <QueryState query={capabilities}>
        {capabilities.data?.canCreateOrganization ? (
          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={form.handleSubmit(async (payload) => {
              const response = await create.run({ payload });
              if (!response) return;
              if (first) {
                setCreated({
                  name: response.value.organization.metadata.name,
                  slug: response.value.organization.slug,
                });
                return;
              }
              await navigate({
                to: "/org/$slug",
                params: { slug: response.value.organization.slug },
              });
            })}
          >
            <OrganizationFields form={form} disabled={create.pending} />
            <SubmitButton
              size="lg"
              wide
              arrow
              pending={create.pending}
              pendingLabel="Creating organization…"
            >
              Create organization
            </SubmitButton>
          </form>
        ) : (
          <Notice tone="warning">Only instance owners can create organizations.</Notice>
        )}
      </QueryState>
    </AuthLayout>
  );
}
