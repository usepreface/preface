import { useNavigate } from "@tanstack/react-router";

import { AlertIcon } from "@usepreface/ui/icons";

import { FormActions } from "#/components/form/form-actions";
import { SaveBar } from "#/components/form/save-bar";
import { SlugField } from "#/components/form/slug-field";
import { TextareaField, TextField } from "#/components/form/text-field";
import { OrgAvatar } from "#/components/organization/org-avatar";
import { updateOrganizationForm } from "#/forms/organization";
import { useOrganization, useUpdateOrganization } from "#/hooks/organizations";
import { formatDate } from "#/lib/dates";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { organizationUrlPrefix } from "#/lib/urls";

export function OrganizationDetails() {
  const { organization, access } = useOrganization();
  const canEdit = access.permissions.includes("organization.update");
  const update = useUpdateOrganization();
  const navigate = useNavigate();
  const saved = {
    slug: organization.slug,
    metadata: {
      name: organization.metadata.name,
      description: organization.metadata.description ?? "",
    },
  };
  const form = useSchemaForm(updateOrganizationForm, { defaultValues: saved, disabled: !canEdit });
  const lastUpdated = `Last updated ${formatDate(organization.updatedAt)}`;

  return (
    <form
      noValidate
      aria-label="Organization details"
      className="flex flex-col gap-5 rounded-xl border bg-surface-1 p-6"
      onSubmit={form.handleSubmit(async (payload) => {
        const response = await update.run({
          params: { organizationId: organization.id },
          payload: {
            ...(form.formState.dirtyFields.slug ? { slug: payload.slug } : {}),
            metadata: {
              ...(form.formState.dirtyFields.metadata?.name
                ? { name: payload.metadata?.name }
                : {}),
              ...(form.formState.dirtyFields.metadata?.description
                ? { description: payload.metadata?.description || null }
                : {}),
            },
          },
        });
        if (!response) return;

        feedback.saved("Organization details");
        form.reset({
          slug: response.value.slug,
          metadata: {
            name: response.value.metadata.name,
            description: response.value.metadata.description ?? "",
          },
        });
        if (response.value.slug !== organization.slug)
          await navigate({
            to: "/org/$slug/settings/general",
            params: { slug: response.value.slug },
          });
      })}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">Organization details</h2>
        <p className="text-13 text-fg-secondary">
          Name, URL and description are visible to everyone in {organization.metadata.name}.
        </p>
      </div>
      <div className="flex items-center gap-3.5">
        <OrgAvatar
          name={form.watch("metadata.name") || organization.metadata.name}
          size="lg"
          className="size-12"
        />
        <div className="flex min-w-0 flex-col">
          <span className="text-base font-medium text-foreground">
            {organization.metadata.name}
          </span>
          <span className="break-all text-caption text-fg-tertiary">
            Created {formatDate(organization.createdAt)} · ID {organization.id}
          </span>
        </div>
      </div>
      <TextField control={form.control} name="metadata.name" label="Name" />
      <SlugField
        control={form.control}
        name="slug"
        label="URL"
        prefix={organizationUrlPrefix}
        source={canEdit ? organization.metadata.name : undefined}
        disabled={!canEdit || update.pending}
        description={
          <span className="flex items-center gap-1.5 text-warning-fg">
            <AlertIcon className="size-3.5" />
            Changing the URL breaks bookmarks and links in old emails.
          </span>
        }
      />
      <TextareaField
        control={form.control}
        name="metadata.description"
        label="Description"
        optional
        textareaProps={{ rows: 4, className: "min-h-28" }}
      />
      {canEdit ? (
        <SaveBar
          dirty={form.formState.isDirty}
          pending={update.pending || form.formState.isSubmitting}
          onReset={() => form.reset(saved)}
          note={lastUpdated}
        />
      ) : (
        <FormActions note={lastUpdated}>{null}</FormActions>
      )}
    </form>
  );
}
