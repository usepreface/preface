"use client";

import * as React from "react";

import {
  ArrowRight01Icon,
  ChartIcon,
  ChartRingIcon,
  File01Icon,
  Home01Icon,
  SentIcon,
  Settings05Icon,
  ShoppingBag01Icon,
  ShoppingCart01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@usepreface/ui/components/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@usepreface/ui/components/sidebar";

export default function SidebarInsetExample() {
  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "#",
        icon: <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />,
        isActive: true,
        items: [
          {
            title: "Overview",
            url: "#",
          },
          {
            title: "Analytics",
            url: "#",
          },
        ],
      },
      {
        title: "Analytics",
        url: "#",
        icon: <HugeiconsIcon icon={ChartIcon} strokeWidth={2} />,
        items: [
          {
            title: "Reports",
            url: "#",
          },
          {
            title: "Metrics",
            url: "#",
          },
        ],
      },
      {
        title: "Orders",
        url: "#",
        icon: <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} />,
        items: [
          {
            title: "All Orders",
            url: "#",
          },
          {
            title: "Pending",
            url: "#",
          },
          {
            title: "Completed",
            url: "#",
          },
        ],
      },
      {
        title: "Products",
        url: "#",
        icon: <HugeiconsIcon icon={ShoppingCart01Icon} strokeWidth={2} />,
        items: [
          {
            title: "All Products",
            url: "#",
          },
          {
            title: "Categories",
            url: "#",
          },
        ],
      },
      {
        title: "Invoices",
        url: "#",
        icon: <HugeiconsIcon icon={File01Icon} strokeWidth={2} />,
      },
      {
        title: "Customers",
        url: "#",
        icon: <HugeiconsIcon icon={UserIcon} strokeWidth={2} />,
      },
      {
        title: "Settings",
        url: "#",
        icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
      },
    ],
    navSecondary: [
      {
        title: "Support",
        url: "#",
        icon: <HugeiconsIcon icon={ChartRingIcon} strokeWidth={2} />,
      },
      {
        title: "Feedback",
        url: "#",
        icon: <HugeiconsIcon icon={SentIcon} strokeWidth={2} />,
      },
    ],
  };

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <Collapsible
                  key={item.title}
                  defaultOpen={item.isActive}
                  render={<SidebarMenuItem />}
                >
                  <SidebarMenuButton render={<a href={item.url} />} isActive={item.isActive}>
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <>
                      <CollapsibleTrigger
                        render={<SidebarMenuAction className="data-open:rotate-90" />}
                      >
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                        <span className="sr-only">Toggle</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton render={<a href={subItem.url} />}>
                                {subItem.title}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  ) : null}
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {data.navSecondary.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<a href={item.url} />} size="sm">
                      {item.icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
