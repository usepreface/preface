import {
  AiChatIcon,
  BellIcon,
  BookIcon,
  CubeIcon,
  DashboardIcon,
  GridIcon,
  HomeIcon,
  ImageIcon,
  LayersIcon,
  PackageIcon,
  SparklesIcon,
  type IconComponent,
} from "@usepreface/ui/icons";

type Item = { to: string; title: string; description: string; icon: IconComponent };

export const nav = [
  {
    label: "Start",
    items: [
      {
        to: "/",
        title: "Overview",
        description: "What's in the kit and how to use it",
        icon: HomeIcon,
      },
    ],
  },
  {
    label: "Foundations",
    items: [
      {
        to: "/foundations/colors",
        title: "Colour",
        description: "Semantic tokens and primitive ramps",
        icon: LayersIcon,
      },
      {
        to: "/foundations/type",
        title: "Typography",
        description: "Families and the text style scale",
        icon: BookIcon,
      },
      {
        to: "/foundations/surface",
        title: "Radius & elevation",
        description: "Corners, shadows and nested surfaces",
        icon: GridIcon,
      },
    ],
  },
  {
    label: "Brand",
    items: [
      {
        to: "/brand/marks",
        title: "Logo & app icons",
        description: "Facet mark, lockups and app icons",
        icon: SparklesIcon,
      },
      {
        to: "/brand/icons",
        title: "Icons",
        description: "Hugeicons as Preface components",
        icon: GridIcon,
      },
      {
        to: "/brand/logos",
        title: "Company logos",
        description: "Integrations, models and socials",
        icon: PackageIcon,
      },
    ],
  },
  {
    label: "Art",
    items: [
      {
        to: "/art/illustrations",
        title: "Illustrations",
        description: "Empty states on stacked plates",
        icon: ImageIcon,
      },
      {
        to: "/art/objects",
        title: "Objects",
        description: "Isometric objects in four palettes",
        icon: CubeIcon,
      },
      {
        to: "/art/backgrounds",
        title: "Backgrounds",
        description: "Skies, gradients, glass and patterns",
        icon: LayersIcon,
      },
    ],
  },
  {
    label: "Product",
    items: [
      {
        to: "/preface/components",
        title: "Components",
        description: "Status, cards, settings, developer",
        icon: PackageIcon,
      },
      {
        to: "/preface/ai",
        title: "AI & chat",
        description: "Citations, sources, steps, composer",
        icon: AiChatIcon,
      },
      {
        to: "/preface/toasts",
        title: "Toasts",
        description: "Sonner, styled for Preface",
        icon: BellIcon,
      },
      {
        to: "/preface/dashboard",
        title: "Dashboard",
        description: "The Ask screen, built from the kit",
        icon: DashboardIcon,
      },
    ],
  },
] as const satisfies readonly { label: string; items: readonly Item[] }[];

export type NavItem = (typeof nav)[number]["items"][number];

export const navItems = nav.flatMap((s) => s.items.map((item) => ({ ...item, group: s.label })));
