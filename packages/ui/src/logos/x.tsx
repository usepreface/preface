// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps } from "./logo-props";

function XLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const label = title ?? "X";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="#000000"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="x"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
  const mono = (cls?: string) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="x"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
  if (variant === "mono") return mono();
  return color();
}
XLogo.brand = "x" as const;
XLogo.title = "X";

export { XLogo };
