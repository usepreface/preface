import * as React from "react";

import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";

import { PrefaceLogo } from "@usepreface/ui/brand";
import { Button } from "@usepreface/ui/components/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@usepreface/ui/components/command";
import { Kbd, KbdGroup } from "@usepreface/ui/components/kbd";
import { Separator } from "@usepreface/ui/components/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@usepreface/ui/components/sidebar";
import { Toaster } from "@usepreface/ui/components/sonner";
import { Tabs, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";
import { useTheme } from "@usepreface/ui/components/theme-provider";
import {
  ArrowRightIcon,
  ComputerIcon,
  GridIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from "@usepreface/ui/icons";
import pkg from "@usepreface/ui/package.json";

import { labPages } from "../lab";
import { nav, navItems } from "../nav";

export type ThemeView = "light" | "dark" | "system" | "split";

const SplitContext = React.createContext(false);

/** Renders a page twice, light on the left and dark on the right, when Split is on. */
export function ThemedPage({ children }: { children: React.ReactNode }) {
  const split = React.useContext(SplitContext);
  if (!split) {
    return <>{children}</>;
  }
  return (
    <div className="grid min-h-full grid-cols-2">
      <div className="light min-w-0 border-r bg-background text-foreground">{children}</div>
      <div className="dark min-w-0 bg-background text-foreground">{children}</div>
    </div>
  );
}

function ThemeSwitch({ view, onView }: { view: ThemeView; onView: (v: ThemeView) => void }) {
  return (
    <Tabs value={view} onValueChange={(v) => onView(v as ThemeView)}>
      <TabsList aria-label="Theme">
        <TabsTrigger value="light" aria-label="Light">
          <SunIcon />
          <span className="max-lg:hidden">Light</span>
        </TabsTrigger>
        <TabsTrigger value="dark" aria-label="Dark">
          <MoonIcon />
          <span className="max-lg:hidden">Dark</span>
        </TabsTrigger>
        <TabsTrigger value="system" aria-label="System">
          <ComputerIcon />
          <span className="max-lg:hidden">System</span>
        </TabsTrigger>
        <TabsTrigger value="split">Split</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

const labEntries = Object.entries(labPages);

function SearchMenu({
  open,
  onOpenChange,
  onView,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onView: (v: ThemeView) => void;
}) {
  const navigate = useNavigate();
  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search the kit"
      description="Jump to a page, a component or a theme"
    >
      <Command loop>
        <CommandInput placeholder="Search pages, components, themes…" />
        <CommandList className="max-h-[min(60vh,420px)]">
          <CommandEmpty>Nothing matches that.</CommandEmpty>
          {nav.map((section) => (
            <CommandGroup key={section.label} heading={section.label}>
              {section.items.map((item) => (
                <CommandItem
                  key={item.to}
                  value={`${item.title} ${item.description} ${section.label}`}
                  onSelect={() => run(() => void navigate({ to: item.to }))}
                >
                  <item.icon />
                  <span>{item.title}</span>
                  <span className="truncate text-fg-tertiary">{item.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandGroup heading={`Component lab · ${labEntries.length}`}>
            {labEntries.map(([name, page]) => (
              <CommandItem
                key={name}
                value={`lab ${page.title}`}
                onSelect={() => run(() => void navigate({ to: "/lab/$name", params: { name } }))}
              >
                <GridIcon />
                <span>{page.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Theme">
            {(
              [
                ["light", "Light", SunIcon],
                ["dark", "Dark", MoonIcon],
                ["system", "System", ComputerIcon],
                ["split", "Split: light and dark side by side", ArrowRightIcon],
              ] as const
            ).map(([v, label, Icon]) => (
              <CommandItem key={v} value={`theme ${label}`} onSelect={() => run(() => onView(v))}>
                <Icon />
                <span>{label}</span>
                <CommandShortcut>Theme</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <span className="text-overline text-fg-accent">404</span>
      <h2 className="text-heading-1">Nothing on this page</h2>
      <p className="text-body-md text-fg-secondary">The page you asked for isn't in the kit.</p>
      <Button variant="outline" nativeButton={false} render={<Link to="/" />} className="mt-2">
        Back to the overview
      </Button>
    </div>
  );
}

export function Shell() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [split, setSplit] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const view: ThemeView = split ? "split" : theme;
  const onView = React.useCallback(
    (v: ThemeView) => {
      setSplit(v === "split");
      setTheme(v === "split" ? "light" : v);
    },
    [setTheme],
  );
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const item = navItems.find((i) => i.to === pathname);
  const lab = pathname.startsWith("/lab/") ? labPages[pathname.slice(5)] : undefined;
  const crumb = item
    ? [item.group, item.title]
    : lab
      ? ["Component lab", lab.title]
      : ["Preface UI Kit"];

  const pageTitle = crumb.length > 1 ? `${crumb[1]} · Preface UI Kit` : "Preface UI Kit";
  React.useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="gap-3 px-3 pt-4 pb-2">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md px-1 py-0.5 outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
          >
            <PrefaceLogo size={18} />
            <span className="mt-px font-mono text-2xs font-medium tracking-wider text-fg-tertiary uppercase">
              UI Kit
            </span>
            <span className="ml-auto rounded-sm bg-surface-3 px-1.5 py-0.5 font-mono text-2xs text-fg-secondary">
              v{pkg.version}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-8 items-center gap-2 rounded-md border bg-background px-2.5 text-13 text-fg-tertiary shadow-xs outline-none transition-colors hover:border-border-default hover:text-fg-secondary focus-visible:ring-3 focus-visible:ring-focus-ring"
          >
            <SearchIcon size={14} />
            Search
            <KbdGroup className="ml-auto">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </button>
        </SidebarHeader>
        <SidebarContent>
          {nav.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((entry) => (
                    <SidebarMenuItem key={entry.to}>
                      <SidebarMenuButton
                        isActive={pathname === entry.to}
                        render={<Link to={entry.to} />}
                      >
                        <entry.icon />
                        <span>{entry.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
          <SidebarGroup>
            <SidebarGroupLabel>Component lab</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {labEntries.map(([name, page]) => (
                  <SidebarMenuItem key={name}>
                    <SidebarMenuButton
                      size="sm"
                      isActive={pathname === `/lab/${name}`}
                      render={<Link to="/lab/$name" params={{ name }} />}
                    >
                      <span>{page.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-fg-tertiary">
            <span className="font-mono">@usepreface/ui</span>
            <span>{labEntries.length} lab pages</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-13 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md backdrop-saturate-150">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-4 self-center" />
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
            {crumb.map((c, i) => (
              <React.Fragment key={c}>
                {i > 0 ? <span className="text-fg-disabled">/</span> : null}
                <span
                  className={
                    i === crumb.length - 1
                      ? "truncate font-medium text-fg"
                      : "text-fg-tertiary max-sm:hidden"
                  }
                >
                  {c}
                </span>
              </React.Fragment>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="md:hidden"
            >
              <SearchIcon />
            </Button>
            <ThemeSwitch view={view} onView={onView} />
          </div>
        </header>
        <SplitContext.Provider value={split}>
          <div key={pathname} className="min-w-0 flex-1">
            <Outlet />
          </div>
        </SplitContext.Provider>
      </SidebarInset>
      <SearchMenu open={searchOpen} onOpenChange={setSearchOpen} onView={onView} />
      <Toaster position="bottom-right" theme={split ? "light" : resolvedTheme} />
    </SidebarProvider>
  );
}
