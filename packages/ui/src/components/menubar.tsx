"use client";

import * as React from "react";

import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar";

import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

/** A row of menus, for editor-style surfaces (the widget designer, the prompt editor). */
function Menubar({ className, ...props }: MenubarPrimitive.Props) {
  return (
    <MenubarPrimitive
      data-slot="menubar"
      className={cn("flex h-9 items-center gap-0.5 rounded-lg border bg-surface-1 p-1", className)}
      {...props}
    />
  );
}

function MenubarMenu({ ...props }: React.ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu data-slot="menubar-menu" {...props} />;
}

function MenubarTrigger({ className, ...props }: React.ComponentProps<typeof DropdownMenuTrigger>) {
  return (
    <DropdownMenuTrigger
      data-slot="menubar-trigger"
      className={cn(
        "flex items-center rounded-md px-2.5 py-1 text-sm font-medium text-fg-secondary outline-hidden select-none hover:bg-hover hover:text-fg focus-visible:ring-3 focus-visible:ring-focus-ring aria-expanded:bg-selected aria-expanded:text-fg",
        className,
      )}
      {...props}
    />
  );
}

function MenubarContent({
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="menubar-content"
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn("w-auto min-w-48", className)}
      {...props}
    />
  );
}

const MenubarGroup = DropdownMenuGroup;
const MenubarPortal = DropdownMenuPortal;
const MenubarItem = DropdownMenuItem;
const MenubarCheckboxItem = DropdownMenuCheckboxItem;
const MenubarRadioGroup = DropdownMenuRadioGroup;
const MenubarRadioItem = DropdownMenuRadioItem;
const MenubarLabel = DropdownMenuLabel;
const MenubarSeparator = DropdownMenuSeparator;
const MenubarShortcut = DropdownMenuShortcut;
const MenubarSub = DropdownMenuSub;
const MenubarSubTrigger = DropdownMenuSubTrigger;
const MenubarSubContent = DropdownMenuSubContent;

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
};
