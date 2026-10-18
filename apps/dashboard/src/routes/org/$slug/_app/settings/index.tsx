import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/org/$slug/_app/settings/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/org/$slug/settings/general", params });
  },
});
