# @usepreface/uikit

Preface UI Kit: the living reference for `@usepreface/ui`. Every page mirrors a page in the Figma
brand kit and renders in light and dark. Built with Vite and TanStack Router.

```sh
pnpm --filter @usepreface/uikit dev   # http://localhost:5174
```

Press <kbd>⌘K</kbd> to search pages, lab components and themes.

## Production SEO

On Vercel, set the project root directory to `apps/uikit`, use the Vite preset, and keep
[system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
enabled. The public origin comes from `VERCEL_PROJECT_PRODUCTION_URL`, falling back to
`VERCEL_URL`. No domain is hardcoded. These variables are included in the Turbo build cache key.

Production deployments are indexable when `VERCEL_TARGET_ENV` (or `VERCEL_ENV` when unset) is
`production`. Preview, custom environment, and local builds use `noindex` and omit the sitemap.
Production builds fail if Vercel cannot provide a public URL. Development is always `noindex`.
Robots rules allow crawling so search engines can read those directives.

The build emits HTML for every gallery and lab route with unique descriptions, canonical
links, Open Graph and Twitter cards, and WebSite/WebPage structured data. Titles use
`Page | Preface UI Kit`. Each HTML page includes an introduction and navigation before
JavaScript loads; interactive examples render in the browser. Metadata updates on client navigation.
Production also gets `robots.txt` and `sitemap.xml` with the same canonical URLs.

`vercel.json` serves the generated HTML at clean URLs and preserves the static `404.html` page.
Keep catch-all rewrites to `index.html` out of the deployment: they would replace route metadata
and turn missing pages into successful responses. Other static hosts need equivalent clean-URL
and 404 handling.

The manifest supplies app identity and home-screen icons. The icon set includes SVG and ICO
favicons, a 180px Apple touch icon, and 192px/512px icons with a separate opaque maskable asset.
The 1200×630 social preview is `public/og-image.png`; its outlined vector source is
`assets/og-image.svg`. Icons derive from `public/favicon.svg`.

Run the focused build-output regression tests with:

```sh
pnpm --filter @usepreface/uikit test
```

Run the shared component keyboard and pointer regressions from the repository root:

```sh
pnpm exec playwright install chromium
pnpm test:uikit
```

This starts a dedicated gallery server on loopback port 5175 and shuts it down afterward.

## Pages

- **Foundations**: colour tokens with resolved values (click to copy hex, variable or class), the
  type scale, radius, elevation and nested surfaces.
- **Brand**: Facet mark, lockups and app icons; the icon set with search, size and stroke; company
  logos in auto, colour and mono. Art tiles download as SVG or PNG and copy their JSX.
- **Art**: empty-state illustrations, isometric objects in four palettes, and the 43 backgrounds
  with their pattern primitives (Studio backgrounds for templates; clouds for the landing page).
- **Components**: date and calendar, menus and overlays (context menu, menubar, navigation menu,
  option menus, hover cards, drawer), disclosure and layout (accordion, collapsible, carousel,
  resizable, scroll area), more inputs (OTP, slider, toggles, button group, native select,
  dropzone) and charts. Figma pages 51–55.
- **Product**: Preface components, AI and chat (a scripted streaming thread, citations, sources,
  agent steps, composer), toasts on sonner, the Ask dashboard screen from Figma page 31, and the
  onboarding flow from pages 56–57 (set up instance, create organization with an editable slug,
  empty organization). The onboarding screens are live: submitting one moves to the next.
- **Component lab**: shadcn/ui's Base UI example pages, re-pointed at the Preface components, for
  every variant, size and state.

The header switches between Light, Dark and System. **Split** renders the current page twice,
light on the left and dark on the right. Popovers and menus open in the light theme in Split.

## Regenerating the lab

`src/lab/*` is generated from the shadcn/ui repository's `apps/v4/registry/bases/base/examples`
(MIT) with imports pointed at `@usepreface/ui`, icons swapped for Hugeicons and the docs-only style
variants removed. `src/shims` stands in for `next/link` and `next/image` in those examples.
