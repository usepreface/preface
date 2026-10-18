import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@usepreface/ui/components/badge";
import { Field, FieldDescription, FieldLabel } from "@usepreface/ui/components/field";
import { Input } from "@usepreface/ui/components/input";
import { LockIcon, UserCircleIcon } from "@usepreface/ui/icons";

import { PersonAvatar } from "#/components/data-display/identity";
import { SaveBar } from "#/components/form/save-bar";
import { TextareaField, TextField } from "#/components/form/text-field";
import { me } from "#/components/shell/me";
import { PageBar, PageContent, PageTitle } from "#/components/shell/page";
import { profileForm } from "#/forms/profile";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { placeholder } from "#/lib/placeholder";

export const Route = createFileRoute("/account/profile")({
  head: () => ({ meta: [{ title: "Profile · Preface" }] }),
  component: Profile,
});

const BIO_LIMIT = 280;

function Profile() {
  const saved = {
    metadata: {
      name: me.name,
      title: placeholder.owner.title,
      bio: "Runs support engineering at Acme. Ask me about escalations, runbooks and the on-call rota.",
    },
  };
  const form = useSchemaForm(profileForm, { defaultValues: saved });
  const name = form.watch("metadata.name") ?? "";
  const bio = form.watch("metadata.bio") ?? "";

  return (
    <>
      <PageBar
        crumbs={[
          { label: "Account", icon: UserCircleIcon, link: { to: "/account/profile" } },
          { label: "Profile" },
        ]}
      />
      <PageContent width="md">
        <PageTitle
          title="Profile"
          description="How you appear to people in every organization you belong to."
        />
        <form
          noValidate
          className="flex flex-col gap-5 rounded-xl border bg-surface-1 p-6"
          onSubmit={form.handleSubmit(() => {
            feedback.saved("Profile");
            form.reset(form.getValues());
          })}
        >
          <div className="flex items-center gap-4">
            <PersonAvatar name={name || me.name} size="xl" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-heading-3 text-foreground">{name || me.name}</span>
              <span className="text-sm text-fg-tertiary">
                No profile photo. Your initials are shown instead.
              </span>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="metadata.name"
              label="Display name"
              inputProps={{ autoComplete: "name" }}
            />
            <TextField
              control={form.control}
              name="metadata.title"
              label="Title"
              optional
              inputProps={{ autoComplete: "organization-title" }}
            />
          </div>
          <TextareaField
            control={form.control}
            name="metadata.bio"
            label="Bio"
            optional
            description={`Shown on your profile card. ${Math.max(0, BIO_LIMIT - bio.length)} characters left.`}
            textareaProps={{ rows: 3, maxLength: BIO_LIMIT }}
          />
          <Field>
            <FieldLabel htmlFor="profile-email" className="flex items-center gap-2">
              Email
              <Badge variant="outline">Read-only</Badge>
            </FieldLabel>
            <div className="relative">
              <LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-icon-secondary" />
              <Input
                id="profile-email"
                value={me.email}
                readOnly
                disabled
                className="pl-9"
                aria-describedby="profile-email-help"
              />
            </div>
            <FieldDescription id="profile-email-help">
              Your sign-in email can’t be changed here. Ask an instance owner if it needs to move.
            </FieldDescription>
          </Field>
          <SaveBar
            dirty={form.formState.isDirty}
            pending={form.formState.isSubmitting}
            onReset={() => form.reset()}
          />
        </form>
      </PageContent>
    </>
  );
}
