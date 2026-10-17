import * as React from "react";

import { Badge } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@usepreface/ui/components/context-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@usepreface/ui/components/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@usepreface/ui/components/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@usepreface/ui/components/hover-card";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@usepreface/ui/components/menubar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@usepreface/ui/components/navigation-menu";
import {
  AiChatIcon,
  AnalyticsIcon,
  ApiIcon,
  ChatIcon,
  ChevronDownIcon,
  CopyIcon,
  DatabaseIcon,
  EditIcon,
  ExternalLinkIcon,
  FilterIcon,
  McpIcon,
  PauseIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
  WebhookIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import { SyncStatus } from "@usepreface/ui/preface/data-display";
import { CitationPreview, PersonPreview, SourcePreview } from "@usepreface/ui/preface/previews";

import { Page, Section, Specimen } from "../components/bench";

const product: [string, string, IconComponent][] = [
  ["Ask", "Cited answers from every connected source", AiChatIcon],
  ["Sources", "GitHub, Slack, Notion, Drive, websites and files", DatabaseIcon],
  ["Channels", "Widget, Slack bot, Discord and the API", ChatIcon],
  ["Analytics", "Answer rate, gaps and escalations", AnalyticsIcon],
];
const developers: [string, string, IconComponent][] = [
  ["REST API", "Ask, search and manage sources", ApiIcon],
  ["MCP server", "Expose collections to agents", McpIcon],
  ["Webhooks", "Answer, escalation and sync events", WebhookIcon],
];

function NavList({ items }: { items: [string, string, IconComponent][] }) {
  return (
    <ul className="grid w-100 gap-1 p-1 sm:grid-cols-2">
      {items.map(([title, description, Icon]) => (
        <li key={title}>
          <NavigationMenuLink href="#" className="flex-row items-start gap-3 rounded-lg p-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-1">
              <Icon className="size-4 text-icon-accent" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{title}</span>
              <span className="text-xs text-fg-secondary">{description}</span>
            </span>
          </NavigationMenuLink>
        </li>
      ))}
    </ul>
  );
}

export function MenusPage() {
  const [failedOnly, setFailedOnly] = React.useState(true);
  const [archived, setArchived] = React.useState(false);
  const [sort, setSort] = React.useState("recent");
  const [cols, setCols] = React.useState({ status: true, docs: true, owner: false });
  const [density, setDensity] = React.useState("comfortable");
  const [collections, setCollections] = React.useState({ engineering: true, support: false });

  return (
    <Page
      figma="52 Menus, hover cards & drawers"
      title="Menus & overlays"
      description="Context menu with a submenu, option menus with checkbox and radio items, a menubar for editor surfaces, the marketing navigation menu, hover-card previews and the mobile drawer."
    >
      <Section
        title="Context menu"
        description="Right-click a source row. Shortcuts right-aligned; destructive items last, in danger."
        className="grid gap-6 md:grid-cols-2"
      >
        <ContextMenu>
          <ContextMenuTrigger className="flex h-40 items-center justify-center gap-3 rounded-xl border border-dashed bg-card text-sm text-fg-secondary select-none">
            <DatabaseIcon className="text-icon-secondary" />
            Right-click acme/platform
          </ContextMenuTrigger>
          <ContextMenuContent className="w-60">
            <ContextMenuItem>
              <RefreshIcon />
              Sync now
              <ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <EditIcon />
              Rename
              <ContextMenuShortcut>F2</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <CopyIcon />
              Copy source ID
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <PlusIcon />
                Add to collection
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuCheckboxItem
                  checked={collections.engineering}
                  onCheckedChange={(v) => setCollections((c) => ({ ...c, engineering: v }))}
                >
                  Engineering
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                  checked={collections.support}
                  onCheckedChange={(v) => setCollections((c) => ({ ...c, support: v }))}
                >
                  Support
                </ContextMenuCheckboxItem>
                <ContextMenuSeparator />
                <ContextMenuItem>
                  <PlusIcon />
                  New collection…
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem>
              <PauseIcon />
              Pause syncing
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              <TrashIcon />
              Remove source
              <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <div className="flex flex-col gap-2 text-13 text-fg-secondary">
          <p>
            Every item in a context menu also exists somewhere visible: the row’s overflow button or
            the page header. The menu is a shortcut, not the only path.
          </p>
          <p>Submenus open on hover or the right arrow, and close with the left arrow or Esc.</p>
        </div>
      </Section>

      <Section
        title="Option menus"
        description="Checkbox items toggle filters and columns; radio items pick one sort or density."
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Specimen label="Actions + toggles">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              <FilterIcon data-icon="inline-start" />
              Sources
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  New source
                  <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Import from file…
                  <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Sync all
                <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>Pause all</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={failedOnly} onCheckedChange={setFailedOnly}>
                Show failed only
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={archived} onCheckedChange={setArchived}>
                Show archived
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Specimen>
        <Specimen label="Columns · checkbox">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              Columns
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                {(
                  [
                    ["status", "Status"],
                    ["docs", "Documents"],
                    ["owner", "Owner"],
                  ] as const
                ).map(([k, label]) => (
                  <DropdownMenuCheckboxItem
                    key={k}
                    checked={cols[k]}
                    onCheckedChange={(v) => setCols((c) => ({ ...c, [k]: v }))}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </Specimen>
        <Specimen label="Sort · radio">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              Sort: {sort === "recent" ? "Last synced" : sort === "name" ? "Name" : "Documents"}
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
                  <DropdownMenuRadioItem value="recent">Last synced</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="docs">Documents</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </Specimen>
      </Section>

      <Section
        title="Menubar"
        description="For editor surfaces such as the widget designer and the prompt editor."
        className="flex"
      >
        <Specimen className="min-h-0 items-start">
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  New prompt <MenubarShortcut>⌘N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Duplicate <MenubarShortcut>⌘D</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Export as JSON <MenubarShortcut>⇧⌘E</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Insert variable <MenubarShortcut>⌘K</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent>
                <MenubarCheckboxItem checked>Show preview</MenubarCheckboxItem>
                <MenubarCheckboxItem>Show token count</MenubarCheckboxItem>
                <MenubarSeparator />
                <MenubarRadioGroup value={density} onValueChange={setDensity}>
                  <MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
                  <MenubarRadioItem value="compact">Compact</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Help</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Prompt guide</MenubarItem>
                <MenubarItem>Keyboard shortcuts</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </Specimen>
      </Section>

      <Section
        title="Navigation menu"
        description="Marketing and docs header. Panels hold icon, title and one line each."
        className="flex"
      >
        <Specimen className="min-h-0 items-start">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavList items={product} />
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Developers</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavList items={developers} />
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
                  Pricing
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
                  Docs
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </Specimen>
      </Section>

      <Section
        title="Hover cards"
        description="Open after a short delay on hover or focus. Person, source and citation previews."
        className="grid gap-6 md:grid-cols-3"
      >
        <Specimen label="Type=Person" className="flex-col items-start gap-4">
          <HoverCard>
            <HoverCardTrigger
              href="#"
              delay={300}
              className="text-sm font-medium text-fg-link underline-offset-4 hover:underline"
            >
              @aisha
            </HoverCardTrigger>
            <HoverCardContent align="start">
              <PersonPreview
                name="Aisha Khan"
                email="aisha@acme.dev"
                bio="Platform lead. Owns the engineering and runbook collections."
                stats={[
                  { value: "128", label: "answers reviewed" },
                  { value: "6", label: "sources" },
                ]}
                meta="Joined March 2026 · Admin"
              />
            </HoverCardContent>
          </HoverCard>
          <div className="w-full rounded-xl border border-border-subtle bg-popover p-4 shadow-md">
            <PersonPreview
              name="Aisha Khan"
              email="aisha@acme.dev"
              bio="Platform lead. Owns the engineering and runbook collections."
              stats={[
                { value: "128", label: "answers reviewed" },
                { value: "6", label: "sources" },
              ]}
              meta="Joined March 2026 · Admin"
            />
          </div>
        </Specimen>
        <Specimen label="Type=Source" className="flex-col items-start gap-4">
          <HoverCard>
            <HoverCardTrigger
              href="#"
              delay={300}
              className="font-mono text-13 text-fg-link underline-offset-4 hover:underline"
            >
              acme/platform
            </HoverCardTrigger>
            <HoverCardContent align="start">
              <SourcePreview
                brand="github"
                name="acme/platform"
                kind="GitHub · repository"
                description="Monorepo for the API, workers and web app. Code, PRs and issues are indexed."
                badges={
                  <>
                    <SyncStatus state="synced">Synced 4m ago</SyncStatus>
                    <Badge variant="outline">2,481 docs</Badge>
                  </>
                }
              />
            </HoverCardContent>
          </HoverCard>
          <div className="w-full rounded-xl border border-border-subtle bg-popover p-4 shadow-md">
            <SourcePreview
              brand="github"
              name="acme/platform"
              kind="GitHub · repository"
              description="Monorepo for the API, workers and web app. Code, PRs and issues are indexed."
              badges={
                <>
                  <SyncStatus state="synced">Synced 4m ago</SyncStatus>
                  <Badge variant="outline">2,481 docs</Badge>
                </>
              }
            />
          </div>
        </Specimen>
        <Specimen label="Type=Citation" className="flex-col items-start gap-4">
          <HoverCard>
            <HoverCardTrigger
              href="#"
              delay={300}
              className="inline-flex h-5 items-center rounded-sm bg-primary-subtle px-1.5 font-mono text-2xs font-semibold text-fg-accent"
            >
              2
            </HoverCardTrigger>
            <HoverCardContent align="start" className="w-80">
              <CitationPreview
                brand="notion"
                title="Rotating staging credentials"
                href="#"
                quote={
                  <>
                    …credentials live in <mark>Vault under secret/staging/db</mark> and rotate every
                    30 days…
                  </>
                }
                location="Notion · Engineering / Runbooks · edited 3d ago"
              />
            </HoverCardContent>
          </HoverCard>
          <div className="w-full rounded-xl border border-border-subtle bg-popover p-3.5 shadow-md">
            <CitationPreview
              brand="notion"
              title="Rotating staging credentials"
              quote={
                <>
                  …credentials live in <mark>Vault under secret/staging/db</mark> and rotate every
                  30 days…
                </>
              }
              location="Notion · Engineering / Runbooks · edited 3d ago"
            />
          </div>
        </Specimen>
      </Section>

      <Section
        title="Drawer"
        description="Bottom sheet on mobile for source actions. Swipe down or tap the backdrop to close."
        className="flex"
      >
        <Specimen>
          <Drawer>
            <DrawerTrigger render={<Button variant="outline" />}>Open source actions</DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto flex w-full max-w-md flex-col">
                <DrawerHeader>
                  <DrawerTitle>acme/platform</DrawerTitle>
                  <DrawerDescription>GitHub · 2,481 documents · synced 4m ago</DrawerDescription>
                </DrawerHeader>
                <div className="flex flex-col gap-1 px-4">
                  {(
                    [
                      [RefreshIcon, "Sync now"],
                      [ExternalLinkIcon, "Open on GitHub"],
                      [PauseIcon, "Pause syncing"],
                    ] as const
                  ).map(([Icon, label]) => (
                    <button
                      key={label}
                      type="button"
                      className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm outline-none hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring"
                    >
                      <Icon className="size-4.5 text-icon-secondary" />
                      {label}
                    </button>
                  ))}
                </div>
                <DrawerFooter>
                  <Button variant="destructive">
                    <TrashIcon data-icon="inline-start" />
                    Remove source
                  </Button>
                  <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </Specimen>
      </Section>
    </Page>
  );
}
