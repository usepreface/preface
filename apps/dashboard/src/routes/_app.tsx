import * as React from "react";

import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

import { Sheet, SheetContent, SheetTitle } from "@usepreface/ui/components/sheet";

import { AppSidebar } from "./_app/-components/app-sidebar";
import { AppTopBar } from "./_app/-components/app-top-bar";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

/*
 * Figma app shell: a 48 px top bar over two floating panels, the sidebar and the page. Below
 * 1024 px the sidebar moves into a sheet opened from the top bar.
 */
function AppShell() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  React.useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-svh flex-col bg-canvas">
      <AppTopBar
        sidebarOpen={sidebarOpen}
        onOpenMenu={() => setSheetOpen(true)}
        onExpandSidebar={() => setSidebarOpen(true)}
      />
      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
        {sidebarOpen ? (
          <AppSidebar
            className="animate-in duration-300 fade-in-0 slide-in-from-left-2 max-lg:hidden"
            onCollapse={() => setSidebarOpen(false)}
          />
        ) : null}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background">
          <Outlet />
        </main>
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-70 bg-canvas p-2">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AppSidebar className="h-full w-full" onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
