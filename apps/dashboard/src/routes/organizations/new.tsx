import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { buttonVariants } from "@usepreface/ui/components/button";
import { ChevronLeftIcon, CloseIcon, ShieldIcon } from "@usepreface/ui/icons";

import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { Notice } from "#/components/feedback/notice";
import { SubmitButton } from "#/components/form/submit-button";
import { OrgPreviewAside } from "#/components/organization/org-preview";
import { OrganizationFields } from "#/components/organization/organization-fields";
import { createOrganizationForm } from "#/forms/organization";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { previewSearch, previewState } from "#/lib/preview";

export const Route = createFileRoute("/organizations/new")({
  head: () => ({ meta: [{ title: "New organization · Preface" }] }),
  validateSearch: previewSearch,
  component: NewOrganization,
});

/** Instance owners only. `?state=creating` previews the pending submit. */
function NewOrganization() {
  const navigate = useNavigate();
  const creating = previewState(["creating"], Route.useSearch().state) === "creating";
  const form = useSchemaForm(createOrganizationForm, {
    defaultValues: creating
      ? {
          metadata: {
            name: "Acme Labs",
            description: "Experiments, prototypes and research notes.",
          },
          slug: "acme-labs",
        }
      : { metadata: { name: "", description: "" }, slug: "" },
  });
  const name = form.watch("metadata.name");
  const slug = form.watch("slug");

  return (
    <AuthLayout
      topRight={
        <Link to="/organizations" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <CloseIcon data-icon="inline-start" />
          Cancel
        </Link>
      }
      aside={<OrgPreviewAside name={name} slug={slug} />}
    >
      <Link
        to="/organizations"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 self-start" })}
      >
        <ChevronLeftIcon data-icon="inline-start" />
        All organizations
      </Link>
      <AuthHeading title="New organization">
        Create a separate space with its own sources, members and sign-in rules. You’ll be its
        owner.
      </AuthHeading>
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={form.handleSubmit((values) =>
          navigate({ to: "/org/$slug", params: { slug: values.slug } }),
        )}
      >
        <OrganizationFields form={form} disabled={creating} />
        <Notice tone="neutral" icon={ShieldIcon}>
          Only instance owners can create organizations. Everyone else joins by invitation.
        </Notice>
        <SubmitButton size="lg" wide arrow pending={creating} pendingLabel="Creating organization…">
          Create organization
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
