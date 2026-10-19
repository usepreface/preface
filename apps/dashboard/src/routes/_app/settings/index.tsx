import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/settings/general", params });
  },
});
