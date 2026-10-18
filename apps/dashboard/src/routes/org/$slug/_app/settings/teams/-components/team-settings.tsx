import * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { PackageIcon } from "@usepreface/ui/icons";
import { SettingsCard } from "@usepreface/ui/preface/cards";

import { ConfirmDialog, ConsequenceList } from "#/components/feedback/confirm-dialog";
import { SaveBar } from "#/components/form/save-bar";
import { TextareaField, TextField } from "#/components/form/text-field";
import { updateTeamForm } from "#/forms/teams";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { type Team } from "#/lib/placeholder";

export function TeamSettings({ team, archiving }: { team: Team; archiving: boolean }) {
  const [confirming, setConfirming] = React.useState(archiving);
  const form = useSchemaForm(updateTeamForm, {
    defaultValues: {
      metadata: { name: team.name, description: team.description },
      slug: team.slug,
    },
  });

  return (
    <>
      <form
        noValidate
        className="flex flex-col gap-5 rounded-xl border bg-surface-1 p-6"
        onSubmit={form.handleSubmit(() => {
          feedback.saved("Team details");
          form.reset(form.getValues());
        })}
      >
        <h2 className="text-sm font-semibold text-foreground">Team details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="metadata.name" label="Name" />
          <TextField
            control={form.control}
            name="slug"
            label="Slug"
            inputProps={{ className: "font-mono" }}
          />
        </div>
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
          note="Created Oct 11 by Aisha Khan"
        />
      </form>
      <SettingsCard
        danger
        title="Archive team"
        description={`Members keep their organization access but lose anything shared only with ${team.name}. You can restore the team later.`}
        action={
          <Button variant="destructive-outline" onClick={() => setConfirming(true)}>
            <PackageIcon data-icon="inline-start" />
            Archive team
          </Button>
        }
      />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        icon={PackageIcon}
        title={`Archive ${team.name}?`}
        description={`${team.members.length} members lose access to 2 collections and the #${team.slug} Slack bot that are shared only with this team.`}
        confirmLabel="Archive team"
        onConfirm={feedback.notConnected}
      >
        <ConsequenceList
          items={[
            { title: "Collections", detail: "Support macros, Escalation runbooks" },
            { title: "Channels", detail: `Slack bot in #${team.slug}` },
          ]}
        />
      </ConfirmDialog>
    </>
  );
}
