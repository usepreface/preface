import type { PublicTeam } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import { FormDialog } from "#/components/feedback/form-dialog";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField, TextareaField } from "#/components/form/text-field";
import { createTeamForm } from "#/forms/teams";
import { useTeamsCreate, useTeamsUpdate } from "#/hooks/membership";
import { useOrganization } from "#/hooks/organizations";
import { feedback } from "#/lib/feedback";
import { useDerivedSlug } from "#/lib/forms/use-derived-slug";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

export function TeamDialog({ team, onClose }: { team?: PublicTeam; onClose: () => void }) {
  const { organization } = useOrganization();
  const create = useTeamsCreate();
  const update = useTeamsUpdate();
  const form = useSchemaForm(createTeamForm, {
    defaultValues: {
      slug: team?.slug ?? "",
      metadata: { name: team?.metadata.name ?? "", description: team?.metadata.description ?? "" },
    },
  });
  useDerivedSlug(form, "metadata.name", "slug");
  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open && !form.formState.isSubmitting) onClose();
      }}
      title={team ? "Edit team" : "Create team"}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <SubmitButton pending={form.formState.isSubmitting}>Save team</SubmitButton>
        </>
      }
      as={(content) => (
        <form
          noValidate
          className="contents"
          onSubmit={form.handleSubmit(async (payload) => {
            const response = team
              ? await update.run({
                  params: { organizationId: organization.id, teamId: team.id },
                  payload: {
                    ...(form.formState.dirtyFields.slug ? { slug: payload.slug } : {}),
                    metadata: {
                      ...(form.formState.dirtyFields.metadata?.name
                        ? { name: payload.metadata.name }
                        : {}),
                      ...(form.formState.dirtyFields.metadata?.description
                        ? { description: payload.metadata.description || null }
                        : {}),
                    },
                  },
                })
              : await create.run({ params: { organizationId: organization.id }, payload });
            if (response) {
              feedback.saved("Team");
              onClose();
            }
          })}
        >
          {content}
        </form>
      )}
    >
      <TextField control={form.control} name="metadata.name" label="Team name" />
      <TextField control={form.control} name="slug" label="Slug" />
      <TextareaField
        control={form.control}
        name="metadata.description"
        label="Description"
        optional
      />
    </FormDialog>
  );
}
