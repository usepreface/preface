# @usepreface/uikit

Preface UI Kit: the living reference for `@usepreface/ui`. Every page mirrors a page in the Figma
brand kit and renders in light and dark. Built with Vite and TanStack Router; not deployed.

```sh
pnpm --filter @usepreface/uikit dev   # http://localhost:5174
```

Press <kbd>⌘K</kbd> to search pages, lab components and themes.

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
