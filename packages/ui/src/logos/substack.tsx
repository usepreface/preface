// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps } from "./logo-props";

function SubstackLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const label = title ?? "Substack";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="#FF6719"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="substack"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
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
      data-logo="substack"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
    </svg>
  );
  if (variant === "mono") return mono();
  return color();
}
SubstackLogo.brand = "substack" as const;
SubstackLogo.title = "Substack";

export { SubstackLogo };
