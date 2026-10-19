import {
  AiSearchIcon,
  ClockIcon,
  HashIcon,
  LinkIcon,
  LockIcon,
  ShieldIcon,
} from "@usepreface/ui/icons";
import { InviteSentIllustration, SSOConnectedIllustration } from "@usepreface/ui/illustrations";

import { AuthAside } from "#/components/auth/auth-aside";
import { Route as RootRoute } from "#/routes/__root";

export function SignInAside() {
  const { instance } = RootRoute.useRouteContext();
  return (
    <AuthAside
      art={<SSOConnectedIllustration className="h-64 w-auto" />}
      title="Answers your team can check"
      description={`${instance.organizationName} searches your docs, code and conversations, and cites every answer.`}
      points={[
        [
          AiSearchIcon,
          "Every answer has a source",
          "Click a citation to open the exact passage it came from.",
        ],
        [
          LockIcon,
          "Permissions follow you",
          "You only see answers built from what you can already open.",
        ],
        [
          ShieldIcon,
          "Your organization decides",
          "Admins choose email codes, Google or enterprise SSO.",
        ],
      ]}
    />
  );
}

export function CodeAside() {
  return (
    <AuthAside
      art={<InviteSentIllustration className="h-64 w-auto" />}
      title="Two ways in, one email"
      description="The email has an 8-digit code and a sign-in link. Use whichever is easier. Both expire in 10 minutes."
      points={[
        [
          HashIcon,
          "Type the code here",
          "Works from any device, even if the email is on your phone.",
        ],
        [LinkIcon, "Or open the link", "It signs you in directly in the browser you started from."],
        [ClockIcon, "Single use", "Each code and link works once."],
      ]}
    />
  );
}
