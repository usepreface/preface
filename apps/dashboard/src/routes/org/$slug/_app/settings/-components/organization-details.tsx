import { useParams } from "@tanstack/react-router";

import { AlertIcon } from "@usepreface/ui/icons";

import { SaveBar } from "#/components/form/save-bar";
import { SlugField } from "#/components/form/slug-field";
import { TextareaField, TextField } from "#/components/form/text-field";
import { OrgAvatar } from "#/components/organization/org-avatar";
import { updateOrganizationForm } from "#/forms/organization";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { useSlugStatus } from "#/lib/forms/use-slug-status";
import { organizationBySlug } from "#/lib/placeholder";
import { organizationUrlPrefix } from "#/lib/urls";

export function OrganizationDetails({ archived }: { archived: boolean }) {
  const { slug } = useParams({ from: "/org/$slug/_app" });
  const organization = organizationBySlug(slug);
  const saved = {
    metadata: { name: organization.name, description: organization.description },
    slug,
  };
  const form = useSchemaForm(updateOrganizationForm, { defaultValues: saved, disabled: archived });
  const nextSlug = form.watch("slug") ?? "";
  const status = useSlugStatus(nextSlug, { current: slug });
  const slugChanged = nextSlug !== slug;

  return (
    <form
      noValidate
      className="flex flex-col gap-5 rounded-xl border bg-surface-1 p-6"
      onSubmit={form.handleSubmit(() => {
        feedback.saved("Organization details");
        form.reset(form.getValues());
      })}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">Organization details</h2>
        <p className="text-13 text-fg-secondary">
          Name, URL and description are visible to everyone in {organization.name}.
        </p>
      </div>
      <div className="flex items-center gap-3.5">
        <OrgAvatar
          name={form.watch("metadata.name") || organization.name}
          size="lg"
          muted={archived}
          className="size-12"
        />
        <div className="flex flex-col">
          <span className="text-base font-medium text-foreground">{organization.name}</span>
          <span className="text-caption text-fg-tertiary">
            Created Oct 18, 2026 by Aisha Khan · ID org_7f3c9a2e
          </span>
        </div>
      </div>
      <TextField control={form.control} name="metadata.name" label="Name" />
      <SlugField
        control={form.control}
        name="slug"
        label="URL"
        prefix={organizationUrlPrefix}
        status={slugChanged ? status : undefined}
        disabled={archived}
        description={
          slugChanged && status === "taken" ? (
            `${nextSlug} is already used on this instance.`
          ) : (
            <span className={slugChanged ? "flex items-center gap-1.5 text-warning-fg" : undefined}>
              {slugChanged ? <AlertIcon className="size-3.5" /> : null}
              Changing the URL breaks bookmarks and links in old emails.
            </span>
          )
        }
      />
      <TextareaField
        control={form.control}
        name="metadata.description"
        label="Description"
        optional
        textareaProps={{ rows: 3 }}
      />
      <SaveBar
        dirty={form.formState.isDirty}
        pending={form.formState.isSubmitting}
        onReset={() => form.reset()}
        note={
          archived
            ? "Restore the organization to make changes."
            : "Last changed 2 days ago by Aisha Khan"
        }
      />
    </form>
  );
}
