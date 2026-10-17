"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

/*
 * Tabs, per Figma page 20:
 *   segmented - grey track (surface-4) with a raised white segment. Filters and view switches.
 *   line      - Plane-style underline tabs for page headers.
 */

function Tabs({ className, orientation = "horizontal", ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-3 data-horizontal:flex-col", className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center text-fg-secondary group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:items-stretch",
  {
    variants: {
      variant: {
        segmented: "h-8 gap-0.5 rounded-md bg-surface-4 p-0.5",
        line: "h-9 gap-1 border-b border-border group-data-vertical/tabs:border-r group-data-vertical/tabs:border-b-0",
      },
    },
    defaultVariants: {
      variant: "segmented",
    },
  },
);

function TabsList({
  className,
  variant = "segmented",
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {children}
      {variant === "line" ? (
        <TabsPrimitive.Indicator
          data-slot="tabs-indicator"
          className="absolute bottom-[-1px] left-(--active-tab-left) h-0.5 w-(--active-tab-width) rounded-full bg-foreground transition-[left,width] duration-200 ease-out group-data-vertical/tabs:hidden"
        />
      ) : null}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium outline-none transition-colors",
        "focus-visible:ring-3 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:text-fg-disabled aria-disabled:pointer-events-none",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-icon-secondary data-active:[&_svg]:text-icon",
        // segmented
        "group-data-[variant=segmented]/tabs-list:h-full group-data-[variant=segmented]/tabs-list:rounded-sm group-data-[variant=segmented]/tabs-list:px-2.5 group-data-[variant=segmented]/tabs-list:text-13",
        "group-data-[variant=segmented]/tabs-list:hover:text-foreground group-data-[variant=segmented]/tabs-list:data-active:bg-background group-data-[variant=segmented]/tabs-list:data-active:text-foreground group-data-[variant=segmented]/tabs-list:data-active:shadow-xs",
        // line
        "group-data-[variant=line]/tabs-list:mb-1 group-data-[variant=line]/tabs-list:h-7 group-data-[variant=line]/tabs-list:rounded-sm group-data-[variant=line]/tabs-list:px-2.5 group-data-[variant=line]/tabs-list:text-sm",
        "group-data-[variant=line]/tabs-list:hover:bg-hover group-data-[variant=line]/tabs-list:hover:text-foreground group-data-[variant=line]/tabs-list:data-active:text-foreground",
        "group-data-vertical/tabs:justify-start",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
