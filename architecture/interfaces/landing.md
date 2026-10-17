# Landing interface

`apps/landing` serves the public marketing page using TanStack Start, React and
Nitro. It prerenders one home route and supports Node or Vercel output. It imports
shared presentation from `@usepreface/ui`; it does not call the product backend,
resolve sessions or import persistence/application services.

## Page ownership

| Location                     | Responsibility                                                            |
| ---------------------------- | ------------------------------------------------------------------------- |
| `routes/__root.tsx`          | Document shell, global metadata, theme boot script and not-found page     |
| `routes/index.tsx`           | Home route and build-time GitHub-star loader                              |
| `routes/-home/home-page.tsx` | Section order, skip navigation and page composition                       |
| `routes/-home/sections/`     | Section copy/layout and section-specific behavior                         |
| `routes/-home/components/`   | Home-only section surfaces, illustrations and demonstrations              |
| `routes/-home/hooks/`        | Home-page reveal lifecycle                                                |
| `components/layout/`         | Site navigation/footer, theme switch and GitHub link presentation         |
| `hooks/`                     | Reusable reduced-motion, visibility and scroll-progress behavior          |
| `lib/`                       | Build-time GitHub access and a separately importable pure count formatter |
| `site.ts`                    | Public destinations and site metadata facts                               |

The `-home` prefix keeps implementation files out of the generated route tree.
Keep new route-only code beside its route; promote presentation into app components
when unrelated pages share it. Cross-app presentation belongs to `ui`, while page
copy, navigation and product demonstrations remain owned by landing.

The command-palette demonstration separates sample content, timed query state and
accessible rendering. Its combobox supports pointer selection and keyboard navigation.
The hero's product preview is inert artwork hidden from assistive technology. Neither
demonstration implements product search, chat, API keys or source connection workflows.

## Rendering and motion

The route loads a bounded GitHub-star request during prerendering. Failed/private/
rate-limited lookups return no count, and navigation displays the ordinary Star link.
The pure number formatter does not import network access. The loader stays fresh
indefinitely on the browser after its initial data is supplied.

The boot script applies the saved/system theme before first paint. Browser-only
work lives in effects or external-store subscriptions with server snapshots.
Visibility observers pause loops off screen; reduced-motion preferences suppress
continuous effects. Scroll progress writes a CSS property instead of rendering on
every scroll. Shared hooks own observer/listener/frame cleanup.

Section reveals progressively enhance readable server HTML. Their styles activate
only after JavaScript marks the document; prerendered content remains readable
without scripting. Refactors preserve section anchors, accessible labels, focus,
mobile navigation and reduced-motion behavior.

## Build and public configuration

Development, preview and the built Node command default to port 4000. Node `PORT`
can override that default. Nitro selects the Vercel preset in a Vercel deployment.
Only production deployments are indexable; previews/local output use noindex.
`SITE_URL` overrides the default canonical origin. This public build configuration
contains no deployment credentials.

Shiki uses its JavaScript regex engine. Nitro disables WebAssembly resolution to
avoid selecting Shiki's unused `unwasm` entry. React and React DOM are deduplicated
and externalized as traced runtime dependencies, keeping CommonJS UI hooks and
the server renderer on the same React instance. The output includes those runtime
dependencies; it must be deployed as a complete build.

The built smoke test checks complete prerendered content and anchors, since a
streamed SSR error can otherwise accompany a successful bundling exit. Lint,
typechecking and production builds validate the module graph. Browser interaction
verification remains separate from the artifact check.

Marketing customer counts, source coverage, announcement version, SDK examples
and the self-host terminal are illustrative design content. They do not describe
implemented backend capability; review that copy before public launch. Package-local
commands and deployment details live in the [landing README](../../apps/landing/README.md).

## Source

- [Home composition](../../apps/landing/src/routes/-home/home-page.tsx)
- [Shared site layout](../../apps/landing/src/components/layout)
- [Command-palette demonstration](../../apps/landing/src/routes/-home/components/command-palette)
- [Motion hooks](../../apps/landing/src/hooks)
- [Build configuration](../../apps/landing/vite.config.ts)
- [Artifact regression](../../apps/landing/tests/smoke/build.test.mjs)
