import { SlugField } from "#/components/form/slug-field";
import { TextareaField, TextField } from "#/components/form/text-field";
import type { createOrganizationForm } from "#/forms/organization";
import { useDerivedSlug } from "#/lib/forms/use-derived-slug";
import type { SchemaForm } from "#/lib/forms/use-schema-form";
import { organizationUrlPrefix } from "#/lib/urls";

/*
 * Name, URL and description: the fields of every form that creates an organization. The URL
 * follows the name until it is edited, and a taken URL offers free alternatives.
 */
export function OrganizationFields({
  form,
  disabled,
}: {
  form: SchemaForm<typeof createOrganizationForm>;
  disabled?: boolean;
}) {
  useDerivedSlug(form, "metadata.name", "slug");

  return (
    <>
      <TextField
        control={form.control}
        name="metadata.name"
        label="Organization name"
        description="Your company or team. You can rename it later."
        size="lg"
        inputProps={{ autoComplete: "organization", disabled }}
      />
      <div className="flex flex-col gap-2">
        <SlugField
          control={form.control}
          name="slug"
          label="URL"
          prefix={organizationUrlPrefix}
          disabled={disabled}
          description="Lowercase letters, numbers and dashes. Availability is checked when you create the organization."
        />
      </div>
      <TextareaField
        control={form.control}
        name="metadata.description"
        label="Description"
        optional
        description="Shown when people choose an organization."
        textareaProps={{ rows: 3, disabled }}
      />
    </>
  );
}
