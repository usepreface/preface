# @usepreface/landing

preface.run: the Preface landing page. One route, built with TanStack Start, prerendered to static
HTML and deployed to Vercel. It follows Figma pages 42–44 (Landing v2) section for section, in
light, dark and mobile, and uses `@usepreface/ui` for every control, logo and pattern.

```sh
pnpm --filter @usepreface/landing dev     # http://localhost:4000
pnpm --filter @usepreface/landing build   # prerenders / and writes .output (or .vercel/output on Vercel)
pnpm --filter @usepreface/landing start   # built Node server; defaults to port 4000
pnpm --filter @usepreface/landing test:built
```

## Structure

- `src/routes/__root.tsx`: document shell, metadata, and the boot script that applies the saved
  theme before first paint.
- `src/routes/index.tsx`: the home route. Its loader reads the GitHub star count at build time.
- `src/routes/-home/home-page.tsx`: page composition and section order.
- `src/routes/-home/sections/`: self-contained page sections, including their own copy and local state.
- `src/routes/-home/components/`: home-only section surfaces, illustrations, product preview and
  command-palette demo. The demo separates sample content, typing state and accessible rendering.
- `src/routes/-home/hooks/`: page-specific scroll reveal behavior.
- `src/components/layout/`: site navigation/footer and reusable theme/GitHub controls.
- `src/hooks/`: shared reduced-motion, visibility and scroll-progress hooks.
- `src/lib/`: the build-time GitHub lookup and its separate pure star-count formatter.

The `-home` prefix excludes page implementation files from TanStack's generated route tree.

- `src/site.ts`: links and copy shared by metadata, the nav and the footer.
- `src/styles.css`: the Preface globals plus the landing sky, glass and motion keyframes.

## Build boundary

Vite development and preview default to port 4000. The Node start command also defaults to 4000;
set `PORT` to override it. Nitro disables its WebAssembly export condition because the shared UI
highlighter explicitly uses Shiki's JavaScript regex engine. React and React DOM are deduplicated
and kept as traced runtime dependencies in the Node output, so CommonJS UI hooks and the server
renderer share one React instance. Keep these settings when changing the build pipeline.

The built smoke test checks the prerendered page's main content and section anchors. A successful
bundling exit alone is insufficient: streamed SSR failures can otherwise leave incomplete HTML.

## Motion

Motion follows the notes on the Figma frames: clouds drift on a 60 s loop, tiles float ±6 px over
6 s, the knowledge field flickers 3% of its glyphs every 80 ms, the stack separates by 24 px per
layer while it crosses the viewport, and the self-host panel sweeps a scanline every 4 s with
short glitch bursts. Sections fade up as they enter the viewport. Loops pause off screen, and
`prefers-reduced-motion` turns all of it off. Scroll reveals only hide content once JavaScript is
running, so the prerendered page is readable without it.

## Deploying to Vercel

Create a Vercel project with the root directory set to `apps/landing`. Vercel detects TanStack
Start; Nitro switches to its Vercel preset during the build, so no `vercel.json` is needed. Keep
system environment variables enabled: only production deployments (`VERCEL_TARGET_ENV`, or
`VERCEL_ENV`, is `production`) are indexable. Previews and local builds ship `noindex`. Set
`SITE_URL` to change the canonical origin from `https://preface.run`.

## Before launch

Some copy comes straight from the design and needs real data:

- The customer strip ("Trusted by 1,800+ self-hosted teams", Northwind, Orbit …) is placeholder.
- The "v1.4 · Discord & Telegram sources" announcement, "40+ sources and channels" and the
  `@usepreface/ai-sdk` and `usepreface` packages in the developer section describe planned work.
- `site.contact` is where "Contact sales" and "Book a demo" go; `site.socials` lists only the
  profiles that exist today.
