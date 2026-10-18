import * as React from "react";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { PrefaceMark } from "@usepreface/ui/brand";
import { Button, buttonVariants } from "@usepreface/ui/components/button";
import { ArrowRightIcon, MailIcon } from "@usepreface/ui/icons";
import { LogoTile } from "@usepreface/ui/preface/data-display";

import { AuthHeading } from "#/components/auth/auth-layout";
import { StatusPage } from "#/components/auth/status-page";
import { VerifyCodeForm } from "#/components/auth/verify-code-form";
import { DetailList } from "#/components/data-display/detail-list";
import { feedback } from "#/lib/feedback";
import { placeholder } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

export const Route = createFileRoute("/auth/verify-email")({
  head: () => ({ meta: [{ title: `Confirm your email · ${placeholder.instance.name}` }] }),
  validateSearch: previewSearch,
  component: VerifyExternalEmail,
});

const maskedEmail = "m•••@acme.dev";

/*
 * After Google or SSO, the first time an external account is linked to an invitation, the person
 * confirms the email once. `?state=code` previews the code step.
 */
function VerifyExternalEmail() {
  const navigate = useNavigate();
  const [sent, setSent] = React.useState(
    previewState(["code"], Route.useSearch().state) === "code",
  );

  return (
    <StatusPage topRight={placeholder.instance.name}>
      <div className="flex items-center gap-2.5" aria-hidden="true">
        <LogoTile brand="google" size={44} />
        <ArrowRightIcon className="size-4 text-icon-secondary" />
        <LogoTile size={44}>
          <PrefaceMark size={24} />
        </LogoTile>
      </div>
      <AuthHeading title="Confirm your email" align="center">
        You signed in with Google as{" "}
        <span className="font-medium text-foreground">{maskedEmail}</span>. Confirm it once so
        Preface can link Google to your Acme invitation.
      </AuthHeading>
      <DetailList
        className="w-full rounded-xl border px-3.5"
        labelWidth="w-24"
        items={[
          { label: "Provider", value: "Google" },
          { label: "Account", value: "Marco Rossi" },
          { label: "Email", value: maskedEmail },
        ]}
      />
      {sent ? (
        <div className="w-full text-left">
          <VerifyCodeForm
            label="Code from the email"
            submitLabel="Continue"
            resendIn="0:51"
            onVerified={() =>
              navigate({ to: "/org/$slug", params: { slug: placeholder.organization.slug } })
            }
            onResend={() => feedback.sent("Code sent", `Check ${maskedEmail}.`)}
          />
        </div>
      ) : (
        <div className="flex w-full flex-col gap-2">
          <Button size="lg" onClick={() => setSent(true)}>
            <MailIcon data-icon="inline-start" />
            Send code to {maskedEmail}
          </Button>
          <Link to="/sign-in" className={buttonVariants({ variant: "ghost" })}>
            Use a different Google account
          </Link>
        </div>
      )}
      <p className="text-caption text-fg-tertiary">
        We only ask once. Next time Google signs you straight in.
      </p>
    </StatusPage>
  );
}
