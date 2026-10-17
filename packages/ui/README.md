# @usepreface/ui

The Preface design system in code: [Base UI](https://base-ui.com) components in the shadcn/ui
`base-nova` structure, restyled with the tokens from the **Preface Brand Kit** Figma file, plus
Preface-specific product and AI components, Hugeicons, company logos and the Preface marks.

It is a source package: apps import the TypeScript and CSS directly and their bundler (Vite)
compiles it. There is no build step.

## Use it in an app

```jsonc
// apps/<app>/package.json
"dependencies": { "@usepreface/ui": "workspace:*" }
```

```css
/* apps/<app>/src/styles.css */
@import "@usepreface/ui/globals.css";
```

```tsx
import { CitationChip } from "@usepreface/ui/ai/citation";
import { PrefaceLogo } from "@usepreface/ui/brand";
import { Button } from "@usepreface/ui/components/button";
import { ThemeProvider } from "@usepreface/ui/components/theme-provider";
import { SearchIcon } from "@usepreface/ui/icons";
import { GitHubLogo } from "@usepreface/ui/logos";
import { SourceCard } from "@usepreface/ui/preface/cards";
```

The app needs Tailwind CSS v4 (`@tailwindcss/vite`). `globals.css` pulls in Tailwind, the tokens,
the fonts and an `@source` for this package, so its classes are generated.

## What is inside

| Import path                        | Contents                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `@usepreface/ui/globals.css`       | Tailwind setup, Preface tokens, fonts, shadcn variants and utilities                            |
| `@usepreface/ui/tokens.css`        | Tokens only: primitives, `Theme · Light` under `:root`, `Theme · Dark` under `.dark`            |
| `@usepreface/ui/components/*`      | Base UI components (button, select, dialog, sidebar, trace, message, code-block …)              |
| `@usepreface/ui/ai/*`              | Chat and agent patterns: `citation`, `sources`, `chat`, `composer`, `agent-steps`               |
| `@usepreface/ui/preface/*`         | Product pieces: `cards`, `data-display`, `developer`, `code-snippet`, `layout`                  |
| `@usepreface/ui/icons`             | 115 Hugeicons as React components with Preface names (`SearchIcon`, `McpIcon` …)                |
| `@usepreface/ui/logos`             | 65 company logos from [thesvg.org](https://thesvg.org) (`GitHubLogo`, `SlackLogo` …)            |
| `@usepreface/ui/logos/registry`    | `BrandLogo` by slug, `brandLogos`, `brandGroups`                                                |
| `@usepreface/ui/brand`             | `PrefaceMark`, `PrefaceLogo`, `PrefaceWordmark`, `PrefaceAppIcon`                               |
| `@usepreface/ui/components/sonner` | `Toaster` and `toast()`: sonner styled with Preface tokens and Hugeicons                        |
| `@usepreface/ui/illustrations`     | 38 empty-state illustrations (`NoSourcesIllustration` …), light and dark, with suggested copy   |
| `@usepreface/ui/objects`           | 29 isometric objects (`KnowledgeStackObject` …) in glacier, deep, line and line-dark palettes   |
| `@usepreface/ui/patterns`          | `<Background preset>` (35 presets) and primitives: `DotGrid`, `Clouds`, `MeshGradient`, `Grain` |
| `@usepreface/ui/lib/utils`         | `cn()`, aware of the Preface text-style utilities                                               |
| `@usepreface/ui/hooks/*`           | `use-mobile`, `use-copy-to-clipboard`, `use-highlighted-code`                                   |

## Tokens

Every Figma variable is a CSS variable with the same name as its Figma code syntax, so a value read
in Dev Mode can be pasted as is: `var(--bg-surface-2)`, `var(--text-tertiary)`, `var(--status-danger-bg)`.

Tailwind utilities map onto them:

| Figma                                                     | Utility                                                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `bg/canvas`, `bg/surface-1…4`, `bg/overlay`, `bg/inverse` | `bg-canvas`, `bg-surface-1` … `bg-surface-4`, `bg-overlay`, `bg-inverse`                                                                    |
| `state/hover`, `state/pressed`, `state/selected`          | `bg-hover`, `bg-pressed`, `bg-selected`                                                                                                     |
| `accent/primary` (+ hover, pressed, subtle)               | `bg-primary`, `bg-primary-hover`, `bg-primary-pressed`, `bg-primary-subtle`                                                                 |
| `text/primary … inverse`                                  | `text-fg`, `text-fg-secondary`, `text-fg-tertiary`, `text-fg-disabled`, `text-fg-accent`, `text-fg-link`, `text-fg-inverse`                 |
| `border/subtle … focus`                                   | `border-border` (subtle), `border-border-default`, `border-border-strong`, `border-border-focus`                                            |
| `icon/primary … accent`                                   | `text-icon`, `text-icon-secondary`, `text-icon-accent`                                                                                      |
| `status/*`, `label/*`                                     | `bg-success-bg`, `text-success-fg`, `bg-success` … `danger`, `warning`, `info`, `neutral`, `violet`, `teal`                                 |
| Text styles                                               | `text-display-2xl` … `text-display-md`, `text-heading-1` … `4`, `text-body-lg/md/sm`, `text-caption`, `text-overline`, `text-mono-md/sm/xs` |
| Radius                                                    | `rounded-xs` 4 · `sm` 6 · `md` 8 · `lg` 10 · `xl` 14 · `2xl` 20 · `3xl` 28                                                                  |
| Elevation                                                 | `shadow-xs` raised · `shadow-sm` card · `shadow-md` popover · `shadow-xl` modal · `shadow-glow`                                             |

The shadcn/ui names (`background`, `primary`, `muted`, `accent`, `border`, `ring`, `sidebar-*` …) are
kept and point at the Preface tokens, so components added later with the shadcn CLI pick up the theme.
Tailwind's default palette is removed: every colour comes from the tokens.

Dark mode is the `.dark` class on any ancestor. `ThemeProvider` sets it on `<html>` and remembers
the choice; `useTheme()` reads and changes it.

## Adding components

`components.json` is set up for the shadcn CLI with the Base UI `base-nova` style and Hugeicons:

```sh
cd packages/ui
pnpm dlx shadcn@latest add <component>
```

New components land in `src/components`. Restyle them with the Preface tokens to match Figma before
using them in an app.

## How the Base UI components were made

`src/components/*.tsx` started as shadcn/ui's Base UI registry (`apps/v4/registry/bases/base/ui`)
with the `nova` style compiled in, then:

- the shadcn semantic colours resolve to Preface tokens (see `tokens.css`);
- buttons, inputs, menus, popovers, tooltips, cards, switches and kbd use Preface rules from Figma
  pages 16–30 (sizes S 28 · M 32 · L 40, radius/md on controls, border/subtle + elevation 3 on
  floating surfaces, inverse tooltips, a `destructive-outline` button);
- `badge` and `tabs` are rewritten to the Figma API (badge `variant` × `tone`; segmented and
  line tabs);
- icons are Hugeicons.

`src/styles/shadcn.css` is vendored from `shadcn/tailwind.css` (MIT): the `data-open`,
`data-checked` … variants and the `shimmer`, `scroll-fade` and `no-scrollbar` utilities the
components rely on.

## Checks

```sh
pnpm --filter @usepreface/ui typecheck
pnpm --filter @usepreface/ui lint
```

The package `tsconfig` turns off `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`, which
the shadcn/ui sources assume. Everything else follows the repository's strict Klarity preset.

See `apps/uikit` (Preface UI Kit) for every component, icon, logo and piece of art in both themes.

## Licences

Components derive from shadcn/ui (MIT). Icons are Hugeicons Free (MIT). Company logos come from
thesvg.org and remain trademarks of their owners; follow each brand's guidelines. Toasts use
sonner (MIT).
