import { Link } from "@tanstack/react-router";

import { Button, buttonVariants } from "@usepreface/ui/components/button";
import {
  AlertIcon,
  CheckCircleIcon,
  ClockIcon,
  LogoutIcon,
  MailIcon,
  UsersIcon,
  XCircleIcon,
} from "@usepreface/ui/icons";

import { AuthHeading } from "#/components/auth/auth-layout";
import { StatusIcon, StatusPage } from "#/components/auth/status-page";
import { Person } from "#/components/data-display/identity";
import { feedback } from "#/lib/feedback";
import { invitation, placeholder } from "#/lib/placeholder";

import { InvitationOrgRow } from "./invitation-parts";

export function AccountMismatch() {
  return (
    <StatusPage topRight={placeholder.instance.name}>
      <StatusIcon icon={UsersIcon} tone="warning" />
      <AuthHeading title="This invitation is for another account" align="center">
        You’re signed in with a different email than the one Acme invited. Sign out and continue
        with the invited address.
      </AuthHeading>
      <div className="w-full divide-y overflow-hidden rounded-xl border text-left">
        <AccountRow
          label="Invitation sent to"
          name={invitation.email}
          detail="Acme · Member"
          match
        />
        <AccountRow
          label="You’re signed in as"
          name="marco.rossi@gmail.com"
          detail="Google account"
        />
      </div>
      <div className="flex w-full flex-col gap-2">
        <Link to="/sign-in" className={buttonVariants({ size: "lg" })}>
          <LogoutIcon data-icon="inline-start" />
          Sign out and continue
        </Link>
        <Link to="/organizations" className={buttonVariants({ variant: "ghost" })}>
          Stay signed in
        </Link>
      </div>
    </StatusPage>
  );
}

function AccountRow({
  label,
  name,
  detail,
  match,
}: {
  label: string;
  name: string;
  detail: string;
  match?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 px-3.5 py-3">
      <span className="text-caption font-medium text-fg-tertiary">{label}</span>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Person name={name} detail={detail} size="sm" />
        </div>
        {match ? (
          <CheckCircleIcon className="size-4.5 text-success-fg" aria-label="Invited address" />
        ) : (
          <AlertIcon className="size-4.5 text-warning-fg" aria-label="Different address" />
        )}
      </div>
    </div>
  );
}

export function InvitationClosed({ kind }: { kind: "expired" | "revoked" }) {
  const expired = kind === "expired";
  return (
    <StatusPage topRight={placeholder.instance.name}>
      <StatusIcon icon={expired ? ClockIcon : XCircleIcon} tone={expired ? "warning" : "danger"} />
      <AuthHeading
        title={expired ? "This invitation has expired" : "This invitation was withdrawn"}
        align="center"
      >
        {expired
          ? `Invitations to Acme last 7 days. This one was sent on ${invitation.sentOn}. Ask ${invitation.invitedBy.name} to send a new one.`
          : "An admin at Acme revoked it on Oct 14. If you think that’s a mistake, contact the person who invited you."}
      </AuthHeading>
      <InvitationOrgRow status={expired ? "Expired" : "Revoked"} />
      <div className="flex w-full flex-col gap-2">
        {expired ? (
          <Button
            size="lg"
            onClick={() =>
              feedback.done("Request sent", `${invitation.invitedBy.name} will get an email.`)
            }
          >
            <MailIcon data-icon="inline-start" />
            Ask for a new invitation
          </Button>
        ) : null}
        <Link
          to="/sign-in"
          className={buttonVariants({
            variant: expired ? "ghost" : "default",
            size: expired ? "default" : "lg",
          })}
        >
          Go to sign in
        </Link>
      </div>
    </StatusPage>
  );
}
