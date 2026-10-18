import { createFileRoute, redirect } from "@tanstack/react-router";

/** Root authentication runs before opening the organization picker. */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/organizations" });
  },
});
