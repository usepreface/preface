import { createElement, Suspense } from "react";

import { createRootRoute, createRoute, createRouter, notFound } from "@tanstack/react-router";

import { Spinner } from "@usepreface/ui/components/spinner";

import { NotFound, Shell, ThemedPage } from "./components/shell";
import { labPages } from "./lab";
import { AiPage } from "./pages/ai";
import { BackgroundsPage } from "./pages/backgrounds";
import { BrandMarksPage } from "./pages/brand-marks";
import { ChartsPage } from "./pages/charts";
import { ColorsPage } from "./pages/colors";
import { DashboardPage } from "./pages/dashboard";
import { DateCalendarPage } from "./pages/date-calendar";
import { DisclosurePage } from "./pages/disclosure";
import { IconsPage } from "./pages/icons";
import { IllustrationsPage } from "./pages/illustrations";
import { InputsPage } from "./pages/inputs";
import { LogosPage } from "./pages/logos";
import { MenusPage } from "./pages/menus";
import { ObjectsPage } from "./pages/objects";
import { OnboardingPage } from "./pages/onboarding";
import { OverviewPage } from "./pages/overview";
import { ProductPage } from "./pages/product";
import { SurfacePage } from "./pages/surface";
import { ToastsPage } from "./pages/toasts";
import { TypePage } from "./pages/type";
import { SeoHead } from "./seo/seo-head.js";

const rootRoute = createRootRoute({
  component: function RootLayout() {
    return (
      <>
        <SeoHead />
        <Shell />
      </>
    );
  },
  notFoundComponent: NotFound,
});

/** Wraps a page so the header's Split view can render it in both themes. */
const themed = (Component: () => React.ReactNode) =>
  function Themed() {
    return <ThemedPage>{createElement(Component)}</ThemedPage>;
  };

const parent = { getParentRoute: () => rootRoute };

const labRoute = createRoute({
  ...parent,
  path: "/lab/$name",
  loader: ({ params }) => {
    if (!labPages[params.name]) {
      throw notFound();
    }
  },
  component: function LabRoute() {
    const { name } = labRoute.useParams();
    const entry = labPages[name];
    if (!entry) {
      return null;
    }
    const { Component } = entry;
    return (
      <ThemedPage>
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <Spinner />
            </div>
          }
        >
          <div className="animate-in duration-300 fade-in-0">
            <Component />
          </div>
        </Suspense>
      </ThemedPage>
    );
  },
});

const routeTree = rootRoute.addChildren([
  createRoute({ ...parent, path: "/", component: themed(OverviewPage) }),
  createRoute({ ...parent, path: "/foundations/colors", component: themed(ColorsPage) }),
  createRoute({ ...parent, path: "/foundations/type", component: themed(TypePage) }),
  createRoute({ ...parent, path: "/foundations/surface", component: themed(SurfacePage) }),
  createRoute({ ...parent, path: "/brand/marks", component: themed(BrandMarksPage) }),
  createRoute({ ...parent, path: "/brand/icons", component: themed(IconsPage) }),
  createRoute({ ...parent, path: "/brand/logos", component: themed(LogosPage) }),
  createRoute({ ...parent, path: "/art/illustrations", component: themed(IllustrationsPage) }),
  createRoute({ ...parent, path: "/art/objects", component: themed(ObjectsPage) }),
  createRoute({ ...parent, path: "/art/backgrounds", component: BackgroundsPage }),
  createRoute({ ...parent, path: "/components/date", component: themed(DateCalendarPage) }),
  createRoute({ ...parent, path: "/components/menus", component: themed(MenusPage) }),
  createRoute({ ...parent, path: "/components/disclosure", component: themed(DisclosurePage) }),
  createRoute({ ...parent, path: "/components/inputs", component: themed(InputsPage) }),
  createRoute({ ...parent, path: "/components/charts", component: themed(ChartsPage) }),
  createRoute({ ...parent, path: "/preface/components", component: themed(ProductPage) }),
  createRoute({ ...parent, path: "/preface/ai", component: themed(AiPage) }),
  createRoute({ ...parent, path: "/preface/toasts", component: themed(ToastsPage) }),
  createRoute({ ...parent, path: "/preface/dashboard", component: DashboardPage }),
  createRoute({ ...parent, path: "/preface/onboarding", component: OnboardingPage }),
  labRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
