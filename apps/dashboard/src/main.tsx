import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createRouter, RouterProvider } from "@tanstack/react-router";

import { Toaster } from "@usepreface/ui/components/sonner";
import { ThemeProvider } from "@usepreface/ui/components/theme-provider";
import { TooltipProvider } from "@usepreface/ui/components/tooltip";

import { routeTree } from "./routeTree.gen";

import "./styles.css";

const router = createRouter({ routeTree, defaultPreload: "intent", scrollRestoration: true });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root");
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider delay={300}>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
);
