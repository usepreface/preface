import type * as React from "react";

/** Stand-in for next/link used by the ported shadcn examples. */
export default function Link({ href, ...props }: React.ComponentProps<"a"> & { href: string }) {
  return <a href={href} {...props} />;
}
