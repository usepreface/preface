import { useEffect, type ReactNode } from "react";

import { useRouterState } from "@tanstack/react-router";

import { useAuthorityReset } from "#/hooks/authority";
import { useSession } from "#/hooks/session";
import { isPublicPath } from "#/lib/route-access";

export function AuthorityBoundary({ children }: { children: ReactNode }) {
  const session = useSession();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const fingerprint =
    session.data === undefined ? undefined : (session.data?.session.id ?? "signed-out");
  const blocked = useAuthorityReset(fingerprint);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") session.refetch();
    };
    const interval = window.setInterval(refresh, 30_000);
    return () => {
      window.clearInterval(interval);
    };
  }, [session.refetch]);

  if (blocked || (fingerprint === "signed-out" && !isPublicPath(path)))
    return (
      <p role="status" className="p-6">
        Checking your session…
      </p>
    );
  return children;
}
