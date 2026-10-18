import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { TrashIcon } from "@usepreface/ui/icons";

import { Permission } from "#/components/api/permission";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField, TextareaField } from "#/components/form/text-field";
import { PageTitle, PageSection } from "#/components/shell/page";
import { updateOrganizationForm } from "#/forms/organization";
import {
  useOrganization,
  useUpdateOrganization,
  useArchiveOrganization,
  useLeaveOrganization,
} from "#/hooks/organizations";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

import { SettingsFrame } from "./-components/settings-frame";

export const Route = createFileRoute("/org/$slug/_app/settings/general")({
  component: () => (
    <Permission permission="organization.read">
      <General />
    </Permission>
  ),
});
function General() {
  const { organization, access } = useOrganization();
  const update = useUpdateOrganization();
  const archive = useArchiveOrganization();
  const leave = useLeaveOrganization();
  const navigate = useNavigate();
  const [action, setAction] = useState<"archive" | "leave">();
  const form = useSchemaForm(updateOrganizationForm, {
    defaultValues: {
      slug: organization.slug,
      metadata: {
        name: organization.metadata.name,
        description: organization.metadata.description ?? "",
      },
    },
  });
  return (
    <SettingsFrame crumbs={[{ label: "General" }]}>
      <PageTitle title="General" description="Organization identity and lifecycle." />
      <form
        className="flex flex-col gap-5 rounded-xl border p-5"
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
          if (response) {
            feedback.saved("Organization");
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
          }
        })}
      >
        <TextField
          control={form.control}
          name="metadata.name"
          label="Organization name"
          inputProps={{ disabled: !access.permissions.includes("organization.update") }}
        />
        <TextField
          control={form.control}
          name="slug"
          label="URL slug"
          inputProps={{ disabled: !access.permissions.includes("organization.update") }}
        />
        <TextareaField
          control={form.control}
          name="metadata.description"
          label="Description"
          optional
          textareaProps={{ disabled: !access.permissions.includes("organization.update") }}
        />
        {access.permissions.includes("organization.update") ? (
          <SubmitButton pending={update.pending} disabled={!form.formState.isDirty}>
            Save organization
          </SubmitButton>
        ) : null}
      </form>
      <PageSection title="Organization access">
        <div className="flex gap-3">
          {access.permissions.includes("organization.archive") ? (
            <Button variant="outline" onClick={() => setAction("archive")}>
              Archive organization
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => setAction("leave")}>
            Leave organization
          </Button>
        </div>
      </PageSection>
      <ConfirmDialog
        open={Boolean(action)}
        onOpenChange={(open) => {
          if (!open) setAction(undefined);
        }}
        pending={archive.pending || leave.pending}
        icon={TrashIcon}
        title={action === "archive" ? "Archive organization?" : "Leave organization?"}
        description={
          action === "archive"
            ? "Organization access is blocked until an owner restores it."
            : "You lose your membership and team access. Rejoining requires an invitation."
        }
        confirmText={organization.slug}
        confirmLabel="Confirm"
        onConfirm={async () => {
          const input = { params: { organizationId: organization.id }, payload: {} };
          const response = action === "archive" ? await archive.run(input) : await leave.run(input);
          if (response) await navigate({ to: "/organizations" });
        }}
      />
    </SettingsFrame>
  );
}
