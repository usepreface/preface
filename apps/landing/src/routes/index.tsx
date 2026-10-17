import { createFileRoute } from "@tanstack/react-router";

import { fetchGitHubStars } from "../lib/github";
import { HomePage } from "./-home/home-page";

export const Route = createFileRoute("/")({
  loader: async () => ({ stars: await fetchGitHubStars() }),
  // The page is prerendered once at build time; never refetch the count in the browser.
  staleTime: Number.POSITIVE_INFINITY,
  component: function Home() {
    const { stars } = Route.useLoaderData();
    return <HomePage stars={stars} />;
  },
});
