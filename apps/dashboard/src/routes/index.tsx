import { createFileRoute, redirect } from "@tanstack/react-router";

/** The instance root. Until sessions are wired, it opens the organization picker. */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/organizations" });
  },
});
