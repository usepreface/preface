import { createFileRoute } from "@tanstack/react-router";

import type { PublicUser } from "@usepreface/protocol/dto";
import { Badge } from "@usepreface/ui/components/badge";
import { Field, FieldDescription, FieldLabel } from "@usepreface/ui/components/field";
import { Input } from "@usepreface/ui/components/input";
import { LockIcon, UserCircleIcon } from "@usepreface/ui/icons";

import { profileUpdateMutation } from "#/atoms/auth";
import { ApiClient } from "#/atoms/client";
import { QueryKeys } from "#/atoms/query-keys";
import { QueryState } from "#/components/api/query-state";
import { PersonAvatar } from "#/components/data-display/identity";
import { SaveBar } from "#/components/form/save-bar";
import { TextField, TextareaField } from "#/components/form/text-field";
import { PageBar, PageContent, PageTitle } from "#/components/shell/page";
import { profileForm } from "#/forms/profile";
import { toMutation } from "#/hooks/mutation";
import { toQuery } from "#/hooks/query";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { requestFields } from "#/lib/request-fields";

export const Route = createFileRoute("/account/profile")({ component: Profile });
const useProfile = toQuery(() =>
  ApiClient.query(
    "profile",
    "get",
    requestFields({ reactivityKeys: [QueryKeys.authority, QueryKeys.account] }),
  ),
);
const useUpdate = toMutation(profileUpdateMutation);
function Profile() {
  const query = useProfile();
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
        <QueryState query={query}>
          {query.data ? <ProfileForm key={query.data.id} user={query.data} /> : null}
        </QueryState>
      </PageContent>
    </>
  );
}
const BIO_LIMIT = 1024;

function ProfileForm({ user }: { user: PublicUser }) {
  const update = useUpdate();
  const form = useSchemaForm(profileForm, {
    defaultValues: {
      metadata: {
        name: user.metadata.name,
        title: user.metadata.title ?? "",
        bio: user.metadata.bio ?? "",
      },
    },
  });
  return (
    <form
      className="flex flex-col gap-5 rounded-xl border bg-surface-1 p-6"
      noValidate
      onSubmit={form.handleSubmit(async (payload) => {
        const response = await update.run({
          payload: {
            metadata: {
              ...(form.formState.dirtyFields.metadata?.name ? { name: payload.metadata.name } : {}),
              ...(form.formState.dirtyFields.metadata?.title
                ? { title: payload.metadata.title || null }
                : {}),
              ...(form.formState.dirtyFields.metadata?.bio
                ? { bio: payload.metadata.bio || null }
                : {}),
            },
          },
        });
        if (response) {
          feedback.saved("Profile");
          form.reset({
            metadata: {
              name: response.value.metadata.name,
              title: response.value.metadata.title ?? "",
              bio: response.value.metadata.bio ?? "",
            },
          });
        }
      })}
    >
      <div className="flex items-center gap-4">
        <PersonAvatar name={form.watch("metadata.name") || user.metadata.name} size="xl" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-heading-3 text-foreground">
            {form.watch("metadata.name") || user.metadata.name}
          </span>
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
        description={`Shown on your profile card. ${Math.max(0, BIO_LIMIT - (form.watch("metadata.bio") ?? "").length)} characters left.`}
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
            value={user.email}
            readOnly
            disabled
            className="pl-9"
            aria-describedby="profile-email-help"
          />
        </div>
        <FieldDescription id="profile-email-help">
          Your sign-in email can’t be changed here.
        </FieldDescription>
      </Field>
      <SaveBar
        dirty={form.formState.isDirty}
        pending={update.pending}
        onReset={() => form.reset()}
      />
    </form>
  );
}
