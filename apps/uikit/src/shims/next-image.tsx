import type * as React from "react";

/** Stand-in for next/image used by the ported shadcn examples. */
export default function Image({
  fill,
  priority: _priority,
  className,
  style,
  ...props
}: React.ComponentProps<"img"> & { fill?: boolean; priority?: boolean }) {
  return (
    <img
      className={className}
      style={
        fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style
      }
      {...props}
    />
  );
}
