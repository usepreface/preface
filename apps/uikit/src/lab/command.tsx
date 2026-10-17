"use client";

import * as React from "react";

import {
  CalculatorIcon,
  CalendarIcon,
  ClipboardIcon,
  CodeIcon,
  CopyIcon,
  CreditCardIcon,
  DeleteIcon,
  File02Icon,
  FolderAddIcon,
  FolderIcon,
  GridIcon,
  HelpCircleIcon,
  HomeIcon,
  ImageIcon,
  InboxIcon,
  Menu05Icon,
  NotificationIcon,
  PlusSignIcon,
  ScissorIcon,
  SettingsIcon,
  SmileIcon,
  UserIcon,
  ZoomInAreaIcon,
  ZoomOutAreaIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@usepreface/ui/components/button";
import { Card, CardContent } from "@usepreface/ui/components/card";
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

import { Example, ExampleWrapper } from "../components/example";

export default function CommandExample() {
  return (
    <ExampleWrapper>
      <CommandInline />
      <CommandBasic />
      <CommandWithShortcuts />
      <CommandWithGroups />
      <CommandManyItems />
    </ExampleWrapper>
  );
}

function CommandInline() {
  return (
    <Example title="Inline">
      <Card className="w-full p-0">
        <CardContent className="p-0">
          <Command>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>
                  <HugeiconsIcon icon={CalendarIcon} strokeWidth={2} />
                  <span>Calendar</span>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={SmileIcon} strokeWidth={2} />
                  <span>Search Emoji</span>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={CalculatorIcon} strokeWidth={2} />
                  <span>Calculator</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                <CommandItem>
                  <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
                  <span>Profile</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                  <span>Billing</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={SettingsIcon} strokeWidth={2} />
                  <span>Settings</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CardContent>
      </Card>
    </Example>
  );
}

function CommandBasic() {
  const [open, setOpen] = React.useState(false);

  return (
    <Example title="Basic">
      <div className="flex flex-col gap-4">
        <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
          Open Menu
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <Command>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>Calendar</CommandItem>
                <CommandItem>Search Emoji</CommandItem>
                <CommandItem>Calculator</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </div>
    </Example>
  );
}

function CommandWithShortcuts() {
  const [open, setOpen] = React.useState(false);

  return (
    <Example title="With Shortcuts">
      <div className="flex flex-col gap-4">
        <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
          Open Menu
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <Command>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Settings">
                <CommandItem>
                  <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
                  <span>Profile</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                  <span>Billing</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={SettingsIcon} strokeWidth={2} />
                  <span>Settings</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </div>
    </Example>
  );
}

function CommandWithGroups() {
  const [open, setOpen] = React.useState(false);

  return (
    <Example title="With Groups">
      <div className="flex flex-col gap-4">
        <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
          Open Menu
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <Command>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>
                  <HugeiconsIcon icon={CalendarIcon} strokeWidth={2} />
                  <span>Calendar</span>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={SmileIcon} strokeWidth={2} />
                  <span>Search Emoji</span>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={CalculatorIcon} strokeWidth={2} />
                  <span>Calculator</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                <CommandItem>
                  <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
                  <span>Profile</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                  <span>Billing</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={SettingsIcon} strokeWidth={2} />
                  <span>Settings</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </div>
    </Example>
  );
}

function CommandManyItems() {
  const [open, setOpen] = React.useState(false);

  return (
    <Example title="Many Groups & Items">
      <div className="flex flex-col gap-4">
        <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
          Open Menu
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <Command>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Navigation">
                <CommandItem>
                  <HugeiconsIcon icon={HomeIcon} strokeWidth={2} />
                  <span>Home</span>
                  <CommandShortcut>⌘H</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={InboxIcon} strokeWidth={2} />
                  <span>Inbox</span>
                  <CommandShortcut>⌘I</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={File02Icon} strokeWidth={2} />
                  <span>Documents</span>
                  <CommandShortcut>⌘D</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={FolderIcon} strokeWidth={2} />
                  <span>Folders</span>
                  <CommandShortcut>⌘F</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Actions">
                <CommandItem>
                  <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
                  <span>New File</span>
                  <CommandShortcut>⌘N</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
                  <span>New Folder</span>
                  <CommandShortcut>⇧⌘N</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={CopyIcon} strokeWidth={2} />
                  <span>Copy</span>
                  <CommandShortcut>⌘C</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={ScissorIcon} strokeWidth={2} />
                  <span>Cut</span>
                  <CommandShortcut>⌘X</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={ClipboardIcon} strokeWidth={2} />
                  <span>Paste</span>
                  <CommandShortcut>⌘V</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={DeleteIcon} strokeWidth={2} />
                  <span>Delete</span>
                  <CommandShortcut>⌫</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="View">
                <CommandItem>
                  <HugeiconsIcon icon={GridIcon} strokeWidth={2} />
                  <span>Grid View</span>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={Menu05Icon} strokeWidth={2} />
                  <span>List View</span>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={ZoomInAreaIcon} strokeWidth={2} />
                  <span>Zoom In</span>
                  <CommandShortcut>⌘+</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={ZoomOutAreaIcon} strokeWidth={2} />
                  <span>Zoom Out</span>
                  <CommandShortcut>⌘-</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Account">
                <CommandItem>
                  <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
                  <span>Profile</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                  <span>Billing</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={SettingsIcon} strokeWidth={2} />
                  <span>Settings</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />
                  <span>Notifications</span>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
                  <span>Help & Support</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Tools">
                <CommandItem>
                  <HugeiconsIcon icon={CalculatorIcon} strokeWidth={2} />
                  <span>Calculator</span>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={CalendarIcon} strokeWidth={2} />
                  <span>Calendar</span>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={ImageIcon} strokeWidth={2} />
                  <span>Image Editor</span>
                </CommandItem>
                <CommandItem>
                  <HugeiconsIcon icon={CodeIcon} strokeWidth={2} />
                  <span>Code Editor</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </div>
    </Example>
  );
}
