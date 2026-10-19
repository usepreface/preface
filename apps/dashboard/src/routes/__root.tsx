import {
  HeadContent,
  Link,
  Outlet,
  createRootRouteWithContext,
  redirect,
} from "@tanstack/react-router";

import type { AtomRegistry } from "effect/reactivity";

import { PrefaceLogo } from "@usepreface/ui/brand";
import { buttonVariants } from "@usepreface/ui/components/button";

import { prefetchQuery } from "#/atoms/prefetch";
import { sessionAtom, statusAtom } from "#/atoms/session";
import { AuthorityBoundary } from "#/components/api/authority-boundary";
import { RouteFailure } from "#/components/api/route-failure";
import { isPublicPath } from "#/lib/route-access";

export const Route = createRootRouteWithContext<{ atomRegistry: AtomRegistry.AtomRegistry }>()({
  beforeLoad: async ({ context, location, abortController, preload }) => {
    const status = await prefetchQuery(context.atomRegistry, statusAtom, abortController.signal);
    if (status.state === "setup_required" && !location.pathname.startsWith("/setup"))
      throw redirect({ to: "/setup" });
    if (!preload) context.atomRegistry.refresh(sessionAtom);
    const actor = await prefetchQuery(context.atomRegistry, sessionAtom, abortController.signal);
    if (!isPublicPath(location.pathname) && actor === null) throw redirect({ to: "/sign-in" });
    return { actor, instance: status };
  },
  errorComponent: RouteFailure,
  head: () => ({ meta: [{ title: "Preface" }] }),
  component: Root,
  notFoundComponent: NotFound,
});

function Root() {
  return (
    <>
      <HeadContent />
      <AuthorityBoundary>
        <Outlet />
      </AuthorityBoundary>
    </>
  );
}

function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-surface-1 p-6 text-center">
      <PrefaceLogo size={22} />
      <div className="flex flex-col gap-2">
        <h1 className="text-heading-1 text-foreground">Page not found</h1>
        <p className="text-sm text-fg-secondary">This page doesn’t exist yet.</p>
      </div>
      <div className="flex gap-2">
        <Link to="/" className={buttonVariants()}>
          Go home
        </Link>
        <Link to="/setup" className={buttonVariants({ variant: "outline" })}>
          Run setup
        </Link>
      </div>
    </main>
  );
}
