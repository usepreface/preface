import { FormActions } from "#/components/form/form-actions";
import { SaveBar } from "#/components/form/save-bar";
import { TextareaField, TextField } from "#/components/form/text-field";
import { OrgAvatar } from "#/components/organization/org-avatar";
import { updateOrganizationForm } from "#/forms/organization";
import { useOrganization, useUpdateOrganization } from "#/hooks/organizations";
import { formatDate } from "#/lib/dates";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

export function OrganizationDetails() {
  const { organization, access } = useOrganization();
  const canEdit = access.permissions.includes("organization.update");
  const update = useUpdateOrganization();
  const saved = {
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
          payload: {
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
          metadata: {
            name: response.value.metadata.name,
            description: response.value.metadata.description ?? "",
          },
        });
      })}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">Organization details</h2>
        <p className="text-13 text-fg-secondary">
          Name and description are visible to everyone in {organization.metadata.name}.
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
