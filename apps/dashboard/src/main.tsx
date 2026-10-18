import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { RouterProvider } from "@tanstack/react-router";

import { Toaster } from "@usepreface/ui/components/sonner";
import { ThemeProvider } from "@usepreface/ui/components/theme-provider";
import { TooltipProvider } from "@usepreface/ui/components/tooltip";

import { getRouter } from "./router";

import "./styles.css";

const router = getRouter();

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
