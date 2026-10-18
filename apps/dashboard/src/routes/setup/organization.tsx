import { createFileRoute, redirect } from "@tanstack/react-router";

import { CreateOrganization } from "#/components/organization/create-organization";
export const Route = createFileRoute("/setup/organization")({
  beforeLoad: ({ context }) => {
    if (!context.actor) throw redirect({ to: "/sign-in" });
  },
  component: () => <CreateOrganization first />,
});
