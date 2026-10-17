// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps } from "./logo-props";

function NpmLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const label = title ?? "npm";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 2500 2500"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="npm"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path fill="#c00" d="M0 0h2500v2500H0z" />
      <path fill="#fff" d="M1241.5 268.5h-973v1962.9h972.9V763.5h495v1467.9h495V268.5z" />
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
      data-logo="npm"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
    </svg>
  );
  if (variant === "mono") return mono();
  return color();
}
NpmLogo.brand = "npm" as const;
NpmLogo.title = "npm";

export { NpmLogo };
