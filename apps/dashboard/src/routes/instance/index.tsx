import { createFileRoute, Link } from "@tanstack/react-router";

import { buttonVariants } from "@usepreface/ui/components/button";

import { Notice } from "#/components/feedback/notice";
import { PageTitle, PageSection } from "#/components/shell/page";

import { InstancePage } from "./-components/instance-page";

export const Route = createFileRoute("/instance/")({ component: Overview });
function Overview() {
  const { instance, actor } = Route.useRouteContext();
  return (
    <InstancePage crumbs={[{ label: "Overview" }]}>
      <PageTitle
        title={instance.instanceName}
        description="Instance administration is separate from organization membership."
      />
      <PageSection title="Your instance">
        <dl className="grid gap-3 rounded-xl border p-5 text-sm">
          <div>
            <dt className="text-fg-tertiary">Instance</dt>
            <dd>{instance.instanceName}</dd>
          </div>
          <div>
            <dt className="text-fg-tertiary">Owner account</dt>
            <dd>
              {actor?.user.metadata.name} · {actor?.user.email}
            </dd>
          </div>
          <div>
            <dt className="text-fg-tertiary">Dashboard</dt>
            <dd>{window.location.origin}</dd>
          </div>
        </dl>
      </PageSection>
      <div className="flex flex-wrap gap-3">
        <Link to="/organizations/new" className={buttonVariants()}>
          Create organization
        </Link>
        <Link to="/organizations" className={buttonVariants({ variant: "outline" })}>
          Your organizations
        </Link>
        <Link to="/instance/authentication" className={buttonVariants({ variant: "outline" })}>
          Configure Google
        </Link>
        <Link to="/instance/audit" className={buttonVariants({ variant: "outline" })}>
          Instance activity
        </Link>
      </div>
      <Notice>
        Instance ownership does not grant access to other organizations. Open an organization’s
        domain review link to approve its exact claim.
      </Notice>
    </InstancePage>
  );
}
