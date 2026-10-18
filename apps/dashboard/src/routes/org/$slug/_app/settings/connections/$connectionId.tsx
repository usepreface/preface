import * as React from "react";

import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Badge } from "@usepreface/ui/components/badge";
import { Button, buttonVariants } from "@usepreface/ui/components/button";
import { ArrowRightIcon, LockKeyIcon, PlayIcon, XCircleIcon } from "@usepreface/ui/icons";
import { LogoTile } from "@usepreface/ui/preface/data-display";

import { IconTile } from "#/components/data-display/icon-tile";
import { StatusBadge } from "#/components/data-display/status-badge";
import { StepProgress } from "#/components/data-display/step-progress";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { PageTitle } from "#/components/shell/page";
import { SectionCard } from "#/components/shell/section-card";
import { feedback } from "#/lib/feedback";
import { connectionById, connectionDetails } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";
import { connectionStatus } from "#/lib/status";

import { SettingsFrame } from "../-components/settings-frame";
import { LastTest } from "./-components/last-test";
import { OidcSettings } from "./-components/oidc-settings";
import { SamlBody } from "./-components/saml-connection";
import { TestResultSheet } from "./-components/test-result-sheet";
export const Route = createFileRoute("/org/$slug/_app/settings/connections/$connectionId")({
  head: () => ({ meta: [{ title: "SSO connection · Settings · Preface" }] }),
  validateSearch: previewSearch,
  loader: ({ params }) => {
    const connection = connectionById(params.connectionId);
    if (!connection) throw notFound();
    return connection;
  },
  component: ConnectionDetail,
});

const steps = ["Configure", "Test login", "Activate", "Approve in login policy"];

const stepFor = { draft: 1, tested: 3, active: 4, disabled: 1 } as const;

/*
 * One connection, from configuring to approval. `?state=test-passed` and `?state=test-failed`
 * open a test result; on a SAML connection `?state=rotate` opens Add certificate.
 */
function ConnectionDetail() {
  const { slug } = Route.useParams();
  const connection = Route.useLoaderData();
  const state = previewState(["test-passed", "test-failed", "rotate"], Route.useSearch().state);
  const [test, setTest] = React.useState<"passed" | "failed" | null>(
    state === "test-passed" ? "passed" : state === "test-failed" ? "failed" : null,
  );
  const [disabling, setDisabling] = React.useState(false);
  const saml = connection.protocol === "saml";
  const step =
    connection.status === "active" && connection.approved ? 5 : stepFor[connection.status];

  return (
    <SettingsFrame
      crumbs={[
        {
          label: "SSO connections",
          link: { to: "/org/$slug/settings/connections", params: { slug } },
        },
        { label: connection.name },
      ]}
      width="full"
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => setTest(connection.status === "draft" ? "failed" : "passed")}
          >
            <PlayIcon data-icon="inline-start" />
            Test login
          </Button>
          {connection.status === "tested" ? (
            <Button onClick={feedback.notConnected}>Activate</Button>
          ) : null}
        </>
      }
    >
      <PageTitle
        leading={
          connection.brand ? (
            <LogoTile brand={connection.brand} size={44} />
          ) : (
            <IconTile icon={LockKeyIcon} size={44} />
          )
        }
        title={connection.name}
        badges={
          <>
            <Badge variant="outline">{connection.protocol.toUpperCase()}</Badge>
            <StatusBadge status={connectionStatus[connection.status]} />
          </>
        }
        description={connectionDetails.createdBy[connection.protocol]}
      />
      <StepProgress steps={steps} current={step} />
      {saml ? (
        <SamlBody connection={connection} rotating={state === "rotate"} />
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="flex flex-col gap-5">
            <OidcSettings connection={connection} />
          </div>
          <div className="flex flex-col gap-5">
            <LastTest
              connection={connection}
              onOpen={() => setTest(connection.status === "draft" ? "failed" : "passed")}
            />
            <SectionCard title="Next">
              <p className="text-13 text-fg-secondary">
                {connection.status === "active"
                  ? "Approve this connection in the login policy so members can use it."
                  : "Activate to make this connection available, then approve it in the login policy."}
              </p>
              <Link
                to="/org/$slug/settings/authentication"
                params={{ slug }}
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "self-start",
                })}
              >
                Open login policy
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </SectionCard>
            <SectionCard title="Disable connection" danger>
              <p className="text-13 text-fg-secondary">
                Stops sign-ins right away. Configuration is kept.
              </p>
              <Button
                variant="destructive-outline"
                size="sm"
                className="self-start"
                onClick={() => setDisabling(true)}
              >
                Disable
              </Button>
            </SectionCard>
          </div>
        </div>
      )}
      <TestResultSheet
        connection={connection}
        passed={test !== "failed"}
        open={test !== null}
        onOpenChange={() => setTest(null)}
      />
      <ConfirmDialog
        open={disabling}
        onOpenChange={setDisabling}
        icon={XCircleIcon}
        title={`Disable ${connection.name}?`}
        description="People signing in with it are stopped right away. Its configuration is kept, so you can turn it back on."
        confirmLabel="Disable connection"
        onConfirm={feedback.notConnected}
      />
    </SettingsFrame>
  );
}
