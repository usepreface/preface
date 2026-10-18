import { Link, useNavigate } from "@tanstack/react-router";

import { QueryState } from "#/components/api/query-state";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { Notice } from "#/components/feedback/notice";
import { SubmitButton } from "#/components/form/submit-button";
import { createOrganizationForm } from "#/forms/organization";
import { useCreateOrganization } from "#/hooks/organizations";
import { useCapabilities } from "#/hooks/session";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

import { OrgPreviewAside } from "./org-preview";
import { OrganizationFields } from "./organization-fields";

export function CreateOrganization({ first = false }: { first?: boolean }) {
  const form = useSchemaForm(createOrganizationForm, {
    defaultValues: { metadata: { name: "", description: "" }, slug: "" },
  });
  const create = useCreateOrganization();
  const capabilities = useCapabilities();
  const navigate = useNavigate();
  return (
    <AuthLayout
      topRight={<Link to="/organizations">All organizations</Link>}
      aside={<OrgPreviewAside name={form.watch("metadata.name")} slug={form.watch("slug")} />}
    >
      <AuthHeading title={first ? "Create your first organization" : "New organization"}>
        Create a space for your team with its own members and sign-in rules.
      </AuthHeading>
      <QueryState query={capabilities}>
        {capabilities.data?.canCreateOrganization ? (
          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={form.handleSubmit(async (payload) => {
              const response = await create.run({ payload });
              if (response)
                await navigate({
                  to: "/org/$slug",
                  params: { slug: response.value.organization.slug },
                });
            })}
          >
            <OrganizationFields form={form} disabled={create.pending} />
            <SubmitButton size="lg" wide pending={create.pending}>
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
