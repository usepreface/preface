import { createRouter } from "@tanstack/react-router";

import { scheduleTask } from "@effect/atom-react";
import { AtomRegistry } from "effect/reactivity";

import { initializeSetupProof } from "./atoms/transient";
import { QueryLoading } from "./components/api/query-loading";
import { RegistryProvider } from "./components/api/registry-provider";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const atomRegistry = AtomRegistry.make({ scheduleTask, defaultIdleTTL: 30_000 });
  initializeSetupProof(atomRegistry);
  return createRouter({
    routeTree,
    context: { atomRegistry },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: QueryLoading,
    defaultPendingMs: 150,
    defaultPendingMinMs: 0,
    scrollRestoration: true,
    Wrap: ({ children }) => <RegistryProvider registry={atomRegistry}>{children}</RegistryProvider>,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
