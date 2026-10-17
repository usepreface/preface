import { labTitles } from "../lab/catalog.js";

export const siteName = "Preface UI Kit";
export const siteDescription =
  "Explore Preface's React design system: accessible components, semantic tokens, typography, brand assets, and product patterns in light and dark themes.";

export type SeoPage = {
  readonly path: string;
  readonly title: string;
  readonly description: string;
};

export const seoPages: readonly SeoPage[] = [
  { path: "/", title: "React components & design system", description: siteDescription },
  {
    path: "/foundations/colors",
    title: "Colour tokens",
    description:
      "Explore Preface's semantic colour tokens and primitive palettes. Preview light and dark themes, inspect resolved values, and copy colours for your interface.",
  },
  {
    path: "/foundations/type",
    title: "Typography",
    description:
      "Explore Preface's typography system with Geist, Space Grotesk, and JetBrains Mono. Preview font families, text styles, and the complete type scale.",
  },
  {
    path: "/foundations/surface",
    title: "Radius & elevation",
    description:
      "Build consistent surfaces with Preface's radius and elevation tokens. Compare corners, shadows, and nested panels in light and dark themes.",
  },
  {
    path: "/brand/marks",
    title: "Logo & app icons",
    description:
      "Explore the Preface Facet mark, wordmark lockups, and app icons. Compare brand treatments and download assets for light and dark backgrounds.",
  },
  {
    path: "/brand/icons",
    title: "Icons",
    description:
      "Browse and search Preface's React icon library, built on Hugeicons. Compare icon sizes and strokes and find the right icon for your interface.",
  },
  {
    path: "/brand/logos",
    title: "Company logos",
    description:
      "Browse integration, AI model, and social logos in the Preface UI kit. Preview colour and monochrome variants and download SVG or PNG assets.",
  },
  {
    path: "/art/illustrations",
    title: "Illustrations",
    description:
      "Explore Preface's empty-state illustrations on stacked plates. Preview light and dark treatments, download SVG or PNG assets, and copy React examples.",
  },
  {
    path: "/art/objects",
    title: "Isometric objects",
    description:
      "Browse Preface's isometric object illustrations in four palettes. Compare treatments, download SVG or PNG assets, and copy their React components.",
  },
  {
    path: "/art/backgrounds",
    title: "Backgrounds & patterns",
    description:
      "Explore Preface's skies, gradients, glass, and background patterns. Preview reusable backgrounds for product screens, templates, and landing pages.",
  },
  {
    path: "/components/date",
    title: "Date & calendar components",
    description:
      "Try Preface's React calendar, date picker, date range picker, and time inputs. Explore interactive examples in light and dark themes.",
  },
  {
    path: "/components/menus",
    title: "Menus & overlays",
    description:
      "Explore Preface's React menus and overlays, including context menus, menubars, hover cards, and drawers. Try interactive examples in both themes.",
  },
  {
    path: "/components/disclosure",
    title: "Disclosure & layout components",
    description:
      "Try Preface's React accordions, collapsible panels, carousels, resizable layouts, and scroll areas. Explore layout patterns in light and dark themes.",
  },
  {
    path: "/components/inputs",
    title: "Input components",
    description:
      "Explore Preface's React OTP inputs, sliders, toggles, button groups, native selects, and dropzones. Try their interactive examples and states.",
  },
  {
    path: "/components/charts",
    title: "Charts & data visualization",
    description:
      "Explore Preface's React chart cards, KPI displays, legends, and tooltips. Preview data visualization components in light and dark themes.",
  },
  {
    path: "/preface/components",
    title: "Product components",
    description:
      "Explore Preface's product components for status, cards, settings, and developer interfaces. See reusable product patterns in light and dark themes.",
  },
  {
    path: "/preface/ai",
    title: "AI & chat components",
    description:
      "Try Preface's React AI and chat patterns: streaming messages, citations, sources, agent steps, and a message composer in light and dark themes.",
  },
  {
    path: "/preface/toasts",
    title: "Toast notifications",
    description:
      "Try Preface's toast notification examples, powered by Sonner. Preview notification styles and feedback patterns in light and dark themes.",
  },
  {
    path: "/preface/dashboard",
    title: "Dashboard template",
    description:
      "Explore Preface's Ask dashboard template, built from the shared React UI kit. See components, typography, and product patterns together in context.",
  },
  {
    path: "/preface/onboarding",
    title: "Onboarding template",
    description:
      "Try Preface's interactive onboarding UI: set up an instance, create a first organization, and explore its empty state. A reference flow built with React.",
  },
  ...Object.entries(labTitles).map(([name, title]) => ({
    path: `/lab/${name}`,
    title: `${title} component`,
    description: `Explore Preface's ${title} component with interactive React examples. Compare variants, sizes, and states in light and dark themes in the component lab.`,
  })),
];

export function findSeoPage(pathname: string): SeoPage | undefined {
  const path = pathname.replace(/\/+$/, "") || "/";
  return seoPages.find((page) => page.path === path);
}
