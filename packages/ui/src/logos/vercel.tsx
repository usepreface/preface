// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps } from "./logo-props";

function VercelLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const label = title ?? "Vercel";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 256 222"
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="vercel"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path fill="#000" d="m128 0 128 221.705H0z" />
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
      data-logo="vercel"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="m12 1.608 12 20.784H0Z" />
    </svg>
  );
  const onLight = (cls?: string) => (
    <svg
      viewBox="0 0 256 222"
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="vercel"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path fill="#000" d="m128 0 128 221.705H0z" />
    </svg>
  );
  const onDark = (cls?: string) => (
    <svg
      viewBox="0 0 256 222"
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="vercel"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path fill="#fff" d="m128 0 128 221.705H0z" />
    </svg>
  );
  if (variant === "auto")
    return (
      <>
        {onLight("dark:hidden")}
        {onDark("hidden dark:block")}
      </>
    );
  if (variant === "mono") return mono();
  return color();
}
VercelLogo.brand = "vercel" as const;
VercelLogo.title = "Vercel";

export { VercelLogo };
