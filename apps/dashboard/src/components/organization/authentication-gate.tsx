import { Link } from "@tanstack/react-router";

import type { OrganizationAuthenticationMethods } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import {
  organizationIdentityConnectionsLinkMutation,
  organizationIdentityConnectionsReauthenticateMutation,
} from "#/atoms/identity";
import { Notice } from "#/components/feedback/notice";
import { toMutation } from "#/hooks/mutation";
const useLink = toMutation(organizationIdentityConnectionsLinkMutation);
const useRenew = toMutation(organizationIdentityConnectionsReauthenticateMutation);
export function AuthenticationGate({
  methods,
}: {
  methods: typeof OrganizationAuthenticationMethods.Type;
}) {
  const link = useLink();
  const renew = useRenew();
  return (
    <main className="mx-auto flex max-w-160 flex-col gap-5 p-8">
      <h1 className="text-heading-2">Continue with SSO</h1>
      <Notice>Your organization requires authentication with one of these providers.</Notice>
      {[...methods.oidc, ...methods.saml]
        .filter((method) => method.available)
        .map((method) => (
          <Button
            key={method.id}
            disabled={link.pending || renew.pending}
            onClick={async () => {
              const input = { params: { connectionId: method.id }, payload: { returnPath: "/" } };
              const response = method.linked ? await renew.run(input) : await link.run(input);
              if (response) window.location.assign(response.value.authorizationUrl);
            }}
          >
            Continue with {method.name}
          </Button>
        ))}
      <Link to="/auth-recovery">Owner recovery</Link>
      <Link to="/account/security">Accounts and sessions</Link>
    </main>
  );
}
