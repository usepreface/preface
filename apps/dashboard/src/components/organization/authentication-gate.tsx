import { Link } from "@tanstack/react-router";

import type { OrganizationId } from "@usepreface/protocol";
import type { OrganizationAuthenticationMethods } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import {
  organizationIdentityConnectionsLinkMutation,
  organizationIdentityConnectionsReauthenticateMutation,
} from "#/atoms/identity";
import { ReauthenticationLink } from "#/components/auth/reauthentication-link";
import { Notice } from "#/components/feedback/notice";
import { toMutation } from "#/hooks/mutation";

const useLink = toMutation(organizationIdentityConnectionsLinkMutation);
const useReauthenticate = toMutation(organizationIdentityConnectionsReauthenticateMutation);
export function AuthenticationGate({
  organizationId,
  slug,
  methods,
}: {
  organizationId: OrganizationId;
  slug: string;
  methods: typeof OrganizationAuthenticationMethods.Type;
}) {
  const link = useLink();
  const reauthenticate = useReauthenticate();
  if (methods.nextAction === "authenticate_with_email")
    return (
      <main className="mx-auto flex max-w-160 flex-col gap-5 p-8">
        <h1 className="text-heading-2">Confirm your email</h1>
        <Notice>This organization needs email authentication in your current session.</Notice>
        <ReauthenticationLink />
        <Link to="/organizations">All organizations</Link>
      </main>
    );
  return (
    <main className="mx-auto flex max-w-160 flex-col gap-5 p-8">
      <h1 className="text-heading-2">Continue with organization SSO</h1>
      <Notice>
        Your organization requires a current authentication with one of these providers.
      </Notice>
      {[...methods.oidc, ...methods.saml]
        .filter((method) => method.available)
        .map((method) => (
          <Button
            key={method.id}
            disabled={link.pending || reauthenticate.pending}
            onClick={async () => {
              const input = {
                params: { organizationId, connectionId: method.id },
                payload: { returnPath: `/org/${slug}` },
              };
              const response = method.linked
                ? await reauthenticate.run(input)
                : await link.run(input);
              if (response) window.location.assign(response.value.authorizationUrl);
            }}
          >
            {method.linked ? "Sign in again with" : "Link and continue with"} {method.name}
          </Button>
        ))}
      <Link to="/org/$slug/auth-recovery" params={{ slug }}>
        Owner recovery
      </Link>
      <Link to="/organizations">All organizations</Link>
    </main>
  );
}
