import { HeadContent, Link, Outlet, createRootRoute } from "@tanstack/react-router";

import { PrefaceLogo } from "@usepreface/ui/brand";
import { buttonVariants } from "@usepreface/ui/components/button";

export const Route = createRootRoute({
  head: () => ({ meta: [{ title: "Preface" }] }),
  component: Root,
  notFoundComponent: NotFound,
});

function Root() {
  return (
    <>
      <HeadContent />
      <Outlet />
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
