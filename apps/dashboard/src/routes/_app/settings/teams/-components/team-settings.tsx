import type { PublicTeam } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";
import { PackageIcon } from "@usepreface/ui/icons";
import { SettingsCard } from "@usepreface/ui/preface/cards";

import { SaveBar } from "#/components/form/save-bar";
import { TextareaField, TextField } from "#/components/form/text-field";
import { createTeamForm } from "#/forms/teams";
import { useTeamsUpdate } from "#/hooks/membership";
import { formatDate } from "#/lib/dates";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

export function TeamSettings({
  team,
  canUpdate,
  canArchive,
  onArchive,
}: {
  team: PublicTeam;
  canUpdate: boolean;
  canArchive: boolean;
  onArchive: () => void;
}) {
  const update = useTeamsUpdate();
  const form = useSchemaForm(createTeamForm, {
    defaultValues: {
      slug: team.slug,
      metadata: { name: team.metadata.name, description: team.metadata.description ?? "" },
    },
  });

  return (
    <>
      <form
        noValidate
        className="flex flex-col gap-5 rounded-xl border bg-surface-1 p-6"
        onSubmit={form.handleSubmit(async (values) => {
          const dirty = form.formState.dirtyFields;
          const response = await update.run({
            params: { teamId: team.id },
            payload: {
              ...(dirty.slug ? { slug: values.slug } : {}),
              metadata: {
                ...(dirty.metadata?.name ? { name: values.metadata.name } : {}),
                ...(dirty.metadata?.description
                  ? { description: values.metadata.description || null }
                  : {}),
              },
            },
          });
          if (response) {
            form.reset({
              slug: response.value.slug,
              metadata: {
                name: response.value.metadata.name,
                description: response.value.metadata.description ?? "",
              },
            });
            feedback.saved("Team details");
          }
        })}
      >
        <h2 className="text-sm font-semibold text-foreground">Team details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="metadata.name"
            label="Name"
            inputProps={{ disabled: !canUpdate }}
          />
          <TextField
            control={form.control}
            name="slug"
            label="Slug"
            inputProps={{ className: "font-mono", disabled: !canUpdate }}
          />
        </div>
        <TextareaField
          control={form.control}
          name="metadata.description"
          label="Description"
          optional
          textareaProps={{ rows: 3, disabled: !canUpdate }}
        />
        {canUpdate ? (
          <SaveBar
            dirty={form.formState.isDirty}
            pending={update.pending}
            onReset={() => form.reset()}
            note={`Created ${formatDate(team.createdAt)}`}
          />
        ) : null}
      </form>
      {canArchive ? (
        <SettingsCard
          danger
          title="Archive team"
          description="Members keep their organization access but lose team access. Archived teams cannot currently be restored."
          action={
            <Button variant="destructive-outline" onClick={onArchive}>
              <PackageIcon data-icon="inline-start" />
              Archive team
            </Button>
          }
        />
      ) : null}
    </>
  );
}
