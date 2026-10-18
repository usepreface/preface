import * as React from "react";

import { useRouterState } from "@tanstack/react-router";

import { Sheet, SheetContent, SheetTitle } from "@usepreface/ui/components/sheet";

export type SidebarRender = (props: {
  /** Collapses the desktop sidebar; undefined inside the mobile sheet. */
  onCollapse?: () => void;
  /** Closes the mobile sheet after a link is followed. */
  onNavigate?: () => void;
  className?: string;
}) => React.ReactNode;

export type TopBarRender = (props: {
  sidebarOpen: boolean;
  /** Undefined when the layout has no sidebar. */
  onOpenMenu?: () => void;
  onExpandSidebar?: () => void;
}) => React.ReactNode;

/*
 * The app frame from the dashboard designs: a 48 px top bar over two floating panels, the sidebar
 * and the page. Organizations, the account pages and instance administration all use it with
 * their own sidebar. Below 1024 px the sidebar moves into a sheet opened from the top bar.
 */
export function ShellLayout({
  topBar,
  sidebar,
  children,
}: {
  topBar: TopBarRender;
  /** Pages without a sidebar, like the organization picker, leave this out. */
  sidebar?: SidebarRender;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  React.useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-svh flex-col bg-canvas">
      {topBar({
        sidebarOpen,
        onOpenMenu: sidebar ? () => setSheetOpen(true) : undefined,
        onExpandSidebar: sidebar ? () => setSidebarOpen(true) : undefined,
      })}
      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
        {sidebar && sidebarOpen
          ? sidebar({
              className: "animate-in duration-300 fade-in-0 slide-in-from-left-2 max-lg:hidden",
              onCollapse: () => setSidebarOpen(false),
            })
          : null}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background">
          {children}
        </main>
      </div>
      {sidebar ? (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="left" showCloseButton={false} className="w-70 bg-canvas p-2">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {sidebar({ className: "h-full w-full", onNavigate: () => setSheetOpen(false) })}
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
