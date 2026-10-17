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
- **Art**: empty-state illustrations, isometric objects in four palettes, and the 35 backgrounds
  with their pattern primitives.
- **Product**: Preface components, AI and chat (a scripted streaming thread, citations, sources,
  agent steps, composer), toasts on sonner, and the Ask dashboard screen from Figma page 31.
- **Component lab**: shadcn/ui's Base UI example pages, re-pointed at the Preface components, for
  every variant, size and state.

The header switches between Light, Dark and System. **Split** renders the current page twice,
light on the left and dark on the right. Popovers and menus open in the light theme in Split.

## Regenerating the lab

`src/lab/*` is generated from the shadcn/ui repository's `apps/v4/registry/bases/base/examples`
(MIT) with imports pointed at `@usepreface/ui`, icons swapped for Hugeicons and the docs-only style
variants removed. `src/shims` stands in for `next/link` and `next/image` in those examples.
