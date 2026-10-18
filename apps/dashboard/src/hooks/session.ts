import { useRouter } from "@tanstack/react-router";

import { sessionAtom, capabilitiesAtom, logoutMutation } from "#/atoms/session";
import { useResetAuthority } from "#/components/api/registry-provider";

import { toMutation } from "./mutation";
import { toQuery } from "./query";

export const useSession = toQuery(() => sessionAtom);
export const useCapabilities = toQuery(() => capabilitiesAtom);
const useRevokeSession = toMutation(logoutMutation);

export function useSignOut() {
  const mutation = useRevokeSession();
  const resetAuthority = useResetAuthority();
  const router = useRouter();
  return {
    pending: mutation.pending,
    run: async (returnTo: "/sign-in" | "/invitations/accept" = "/sign-in") => {
      // A 204 has no value; success is represented explicitly by the mutation adapter.
      const result = await mutation.run();
      if (result === undefined) return;
      resetAuthority();
      await router.navigate({ to: returnTo });
      await router.invalidate();
    },
  };
}

export function usePerson() {
  const session = useSession();
  const capabilities = useCapabilities();
  return {
    name: session.data?.user.metadata.name ?? "",
    email: session.data?.user.email ?? "",
    instanceOwner: capabilities.data?.canCreateOrganization ?? false,
  };
}
