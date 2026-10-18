import * as React from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { buttonVariants } from "@usepreface/ui/components/button";
import { ArrowRightIcon, CheckCircleIcon, UsersIcon } from "@usepreface/ui/icons";

import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { StatusIcon } from "#/components/auth/status-page";
import { DetailList } from "#/components/data-display/detail-list";
import { Notice } from "#/components/feedback/notice";
import { SubmitButton } from "#/components/form/submit-button";
import { OrgPreviewAside } from "#/components/organization/org-preview";
import { OrganizationFields } from "#/components/organization/organization-fields";
import { createOrganizationForm } from "#/forms/organization";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { placeholder } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";
import { organizationUrl } from "#/lib/urls";

import { setupSteps } from "./-components/setup-asides";

export const Route = createFileRoute("/setup/organization")({
  head: () => ({ meta: [{ title: "Create your organization · Preface" }] }),
  validateSearch: previewSearch,
  component: OrganizationSetup,
});

/*
 * Step 3: the first organization. `?state=taken` previews an unavailable URL and
 * `?state=created` the finished setup.
 */
function OrganizationSetup() {
  const state = previewState(["taken", "created"], Route.useSearch().state);
  const [created, setCreated] = React.useState(state === "created");
  const form = useSchemaForm(createOrganizationForm, {
    defaultValues:
      state === "taken"
        ? { metadata: { name: "Acme", description: "" }, slug: "acme-old" }
        : { metadata: { name: "", description: "" }, slug: "" },
  });
  const name = form.watch("metadata.name");
  const slug = form.watch("slug");

  if (created) {
    return (
      <SetupComplete
        name={name || placeholder.organization.name}
        slug={slug || placeholder.organization.slug}
      />
    );
  }

  return (
    <AuthLayout
      steps={{ labels: setupSteps, current: 3 }}
      topRight="Step 3 of 3"
      aside={<OrgPreviewAside name={name} slug={slug} />}
    >
      <Notice tone="success" icon={CheckCircleIcon}>
        Email verified. Signed in as {placeholder.owner.email}.
      </Notice>
      <AuthHeading title="Create your first organization">
        Organizations hold sources, members, teams and sign-in rules. Most companies need just one.
      </AuthHeading>
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={form.handleSubmit(() => setCreated(true))}
      >
        <OrganizationFields form={form} />
        <SubmitButton
          size="lg"
          wide
          arrow
          pending={form.formState.isSubmitting}
          pendingLabel="Creating organization…"
        >
          Create organization
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}

function SetupComplete({ name, slug }: { name: string; slug: string }) {
  const { owner } = placeholder;
  return (
    <AuthLayout
      steps={{ labels: setupSteps, current: 4 }}
      topRight="Setup complete"
      aside={<OrgPreviewAside name={name} slug={slug} />}
    >
      <StatusIcon icon={CheckCircleIcon} tone="success" size="lg" />
      <AuthHeading title={`${name} is ready`}>
        Your instance is set up and you’re its owner. Invite your team, then connect the first
        source.
      </AuthHeading>
      <DetailList
        className="rounded-xl border px-3.5"
        labelWidth="w-24"
        items={[
          { label: "Organization", value: name },
          { label: "URL", value: organizationUrl(slug), mono: true },
          { label: "Owner", value: `${owner.name} · ${owner.email}` },
          { label: "Sign-in", value: "Email codes · add Google or SSO in Settings" },
        ]}
      />
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Link
          to="/org/$slug"
          params={{ slug }}
          className={buttonVariants({ size: "lg", className: "flex-1" })}
        >
          Open {name}
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
        <Link
          to="/org/$slug/settings/members"
          params={{ slug }}
          className={buttonVariants({ size: "lg", variant: "outline", className: "flex-1" })}
        >
          <UsersIcon data-icon="inline-start" />
          Invite members
        </Link>
      </div>
    </AuthLayout>
  );
}
