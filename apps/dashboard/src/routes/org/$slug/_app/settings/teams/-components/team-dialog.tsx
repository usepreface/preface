import { Button } from "@usepreface/ui/components/button";

import { FormDialog } from "#/components/feedback/form-dialog";
import { SlugField } from "#/components/form/slug-field";
import { SubmitButton } from "#/components/form/submit-button";
import { TextareaField, TextField } from "#/components/form/text-field";
import { createTeamForm } from "#/forms/teams";
import { feedback } from "#/lib/feedback";
import { useDerivedSlug } from "#/lib/forms/use-derived-slug";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { useSlugStatus } from "#/lib/forms/use-slug-status";
import { teams } from "#/lib/placeholder";

const teamSlugs: ReadonlySet<string> = new Set(teams.map((team) => team.slug));

/** Create team: a name, a slug unique in the organization and a description. */
export function CreateTeamDialog({
  open,
  onOpenChange,
  preview,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview?: boolean;
}) {
  const form = useSchemaForm(createTeamForm, {
    defaultValues: preview
      ? {
          metadata: {
            name: "Customer Success",
            description: "Onboarding, renewals and health checks.",
          },
          slug: "customer-success",
        }
      : { metadata: { name: "", description: "" }, slug: "" },
  });
  useDerivedSlug(form, "metadata.name", "slug");
  const slug = form.watch("slug");
  const status = useSlugStatus(slug, { taken: teamSlugs });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create team"
      description="You can add members and choose team leads next."
      as={(content) => (
        <form
          noValidate
          className="contents"
          onSubmit={form.handleSubmit(({ metadata }) => {
            feedback.done(
              `${metadata.name} created`,
              "Add members to share collections and channels with them.",
            );
            onOpenChange(false);
            form.reset();
          })}
        >
          {content}
        </form>
      )}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <SubmitButton disabled={status === "taken"}>Create team</SubmitButton>
        </>
      }
    >
      <TextField
        control={form.control}
        name="metadata.name"
        label="Name"
        inputProps={{ autoFocus: true }}
      />
      <SlugField
        control={form.control}
        name="slug"
        label="Slug"
        prefix="teams/"
        status={status}
        description={
          status === "taken"
            ? `${slug} is already a team in this organization.`
            : "Used in URLs and the API. Must be unique in the organization."
        }
      />
      <TextareaField
        control={form.control}
        name="metadata.description"
        label="Description"
        optional
        textareaProps={{ rows: 3 }}
      />
    </FormDialog>
  );
}
