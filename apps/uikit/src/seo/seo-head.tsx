import { useRouterState } from "@tanstack/react-router";

import { pageMetadata } from "./metadata.js";

export function SeoHead() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { title, canonical, meta, structuredData } = pageMetadata(
    pathname,
    import.meta.env.UIKIT_SITE,
  );

  // React 19 hoists title, meta, and link elements into the document head.
  return (
    <>
      <title>{title}</title>
      {meta.map((tag) => (
        <meta key={tag.name ?? tag.property} {...tag} />
      ))}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {structuredData ? (
        <script type="application/ld+json">
          {JSON.stringify(structuredData).replaceAll("<", "\\u003c")}
        </script>
      ) : null}
    </>
  );
}
