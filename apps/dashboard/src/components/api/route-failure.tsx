import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";

import { Button, buttonVariants } from "@usepreface/ui/components/button";

import { useResetAuthority } from "#/components/api/registry-provider";
import { Notice } from "#/components/feedback/notice";
import { apiErrorMessage } from "#/lib/api-errors";

export function RouteFailure({ error }: ErrorComponentProps) {
  const router = useRouter();
  const resetAuthority = useResetAuthority();
  return (
    <main className="mx-auto flex max-w-160 flex-col gap-4 p-8">
      <Notice tone="warning" title="Couldn’t open this page">
        {apiErrorMessage(error)}
      </Notice>
      <Button
        onClick={() => {
          resetAuthority();
          void router.invalidate();
        }}
      >
        Try again
      </Button>
      <Link to="/organizations" className={buttonVariants({ variant: "outline" })}>
        Organizations
      </Link>
      <Link to="/auth/reauthenticate" className={buttonVariants({ variant: "ghost" })}>
        Confirm your email
      </Link>
    </main>
  );
}
