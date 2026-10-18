import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { buttonVariants } from "@usepreface/ui/components/button";
import { KeyIcon, LockKeyIcon, ShieldIcon, type IconComponent } from "@usepreface/ui/icons";

import { AuthHeading } from "#/components/auth/auth-layout";
import { ProviderButton } from "#/components/auth/auth-parts";
import { StatusIcon, StatusPage } from "#/components/auth/status-page";
import { VerifyCodeForm } from "#/components/auth/verify-code-form";
import { IconTile } from "#/components/data-display/icon-tile";
import { feedback } from "#/lib/feedback";
import { placeholder } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

export const Route = createFileRoute("/auth/reauthenticate")({
  head: () => ({ meta: [{ title: `Confirm it’s you · ${placeholder.instance.name}` }] }),
  validateSearch: previewSearch,
  component: Reauthenticate,
});

/*
 * A fresh check before a sensitive change. Organizations that require SSO confirm through their
 * provider (`?state=sso`); everyone else gets an email code.
 */
function Reauthenticate() {
  const navigate = useNavigate();
  const sso = previewState(["sso"], Route.useSearch().state) === "sso";
  const { slug } = placeholder.organization;
  const back = () => navigate({ to: "/org/$slug/settings/authentication", params: { slug } });

  return (
    <StatusPage topRight={`Acme · ${placeholder.owner.name}`} width="lg">
      <StatusIcon icon={LockKeyIcon} tone="accent" />
      <AuthHeading title="Confirm it’s you" align="center">
        {sso
          ? "Acme requires Okta for this action. Sign in again and you’ll come straight back here."
          : "This change affects how everyone in Acme signs in, so we need a fresh check."}
      </AuthHeading>
      {sso ? (
        <PendingAction
          icon={KeyIcon}
          title="Rotate SAML signing certificate"
          detail="Settings · SSO connections · Okta"
        />
      ) : (
        <PendingAction
          icon={ShieldIcon}
          title="Require single sign-on"
          detail="Settings · Login policy"
        />
      )}
      {sso ? (
        <>
          <ProviderButton brand="okta" variant="default" onClick={feedback.notConnected}>
            Continue with Okta
          </ProviderButton>
          <p className="text-caption text-fg-tertiary">
            Last confirmed 13 hours ago. Acme asks again every 12 hours for sensitive changes.
          </p>
        </>
      ) : (
        <div className="w-full text-left">
          <VerifyCodeForm
            label={`Code sent to ${placeholder.owner.email}`}
            submitLabel="Confirm and continue"
            arrow={false}
            onVerified={back}
            onResend={() => feedback.sent("Code sent", `Check ${placeholder.owner.email}.`)}
          />
        </div>
      )}
      <Link
        to="/org/$slug/settings/authentication"
        params={{ slug }}
        className={buttonVariants({ variant: "ghost", className: "w-full" })}
      >
        Cancel
      </Link>
    </StatusPage>
  );
}

/** The change waiting on the check. */
function PendingAction({
  icon,
  title,
  detail,
}: {
  icon: IconComponent;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border bg-surface-2 px-3.5 py-3 text-left">
      <IconTile icon={icon} className="bg-surface-1" />
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs text-fg-tertiary">{detail}</span>
      </span>
    </div>
  );
}
