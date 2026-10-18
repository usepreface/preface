import { createFileRoute } from "@tanstack/react-router";

import type { PublicUser } from "@usepreface/protocol/dto";
import { Input } from "@usepreface/ui/components/input";

import { profileUpdateMutation } from "#/atoms/auth";
import { ApiClient } from "#/atoms/client";
import { QueryKeys } from "#/atoms/query-keys";
import { QueryState } from "#/components/api/query-state";
import { SubmitButton } from "#/components/form/submit-button";
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
      <PageBar crumbs={[{ label: "Account" }, { label: "Profile" }]} />
      <PageContent width="md">
        <PageTitle title="Profile" description="How you appear across your organizations." />
        <QueryState query={query}>
          {query.data ? <ProfileForm key={query.data.id} user={query.data} /> : null}
        </QueryState>
      </PageContent>
    </>
  );
}
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
      className="flex flex-col gap-5 rounded-xl border p-6"
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
      <TextField control={form.control} name="metadata.name" label="Display name" />
      <TextField control={form.control} name="metadata.title" label="Title" optional />
      <TextareaField control={form.control} name="metadata.bio" label="Bio" optional />
      <label className="flex flex-col gap-2 text-sm">
        Email (read-only)
        <Input value={user.email} readOnly />
      </label>
      <SubmitButton pending={update.pending} disabled={!form.formState.isDirty}>
        Save profile
      </SubmitButton>
    </form>
  );
}
