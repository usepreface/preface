import { Link } from "@tanstack/react-router";

import { buttonVariants } from "@usepreface/ui/components/button";
import { ArrowRightIcon, CheckCircleIcon, UsersIcon } from "@usepreface/ui/icons";

import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { StatusIcon } from "#/components/auth/status-page";
import { DetailList } from "#/components/data-display/detail-list";
import { usePerson } from "#/hooks/session";
import { organizationUrl } from "#/lib/urls";
import { setupSteps } from "#/routes/setup/-components/setup-asides";

import { OrgPreviewAside } from "./org-preview";

export function SetupComplete({ name, slug }: { name: string; slug: string }) {
  const owner = usePerson();
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
