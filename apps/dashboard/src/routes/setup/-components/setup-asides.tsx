import { ClockIcon, LockIcon, MailIcon, ServerIcon, ShieldIcon } from "@usepreface/ui/icons";
import { InviteSentIllustration, SelfHostedIllustration } from "@usepreface/ui/illustrations";

import { AuthAside } from "#/components/auth/auth-aside";

/** The setup steps, shared by both setup screens. */
export const setupSteps = ["Organization", "Verify email"];

export function InstanceAside() {
  return (
    <AuthAside
      art={<SelfHostedIllustration className="h-64 w-auto" />}
      title="Your knowledge, on your servers"
      description="This instance runs on infrastructure you control. The owner you add now manages your organization and invites everyone else."
      points={[
        [
          ServerIcon,
          "Data stays in your network",
          "Documents, embeddings and logs never leave this instance.",
        ],
        [MailIcon, "No passwords to manage", "Owners confirm their email with a one-time code."],
        [
          ShieldIcon,
          "SSO when you’re ready",
          "Your organization can add Okta, Entra ID or any OIDC or SAML provider.",
        ],
      ]}
    />
  );
}

export function VerifyAside() {
  return (
    <AuthAside
      art={<InviteSentIllustration className="h-64 w-auto" />}
      title="One code, no passwords"
      description="Preface signs people in with short-lived email codes, Google or their company’s SSO."
      points={[
        [
          ClockIcon,
          "Codes expire in 10 minutes",
          "Each code works once. Ask for a new one any time.",
        ],
        [
          LockIcon,
          "Only you can finish setup",
          "The instance stays locked until the owner’s email is confirmed.",
        ],
        [
          ShieldIcon,
          "Recover without support",
          "Owners can always get back in with an email code.",
        ],
      ]}
    />
  );
}
