// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps } from "./logo-props";

function DropboxLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const label = title ?? "Dropbox";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="dropbox"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path fill="#0061FE" d="M0 0h128v128H0z" />
      <path
        fill="#F7F5F2"
        d="M43.7 32 23.404 44.75 43.701 57.5 64 44.75 84.3 57.5l20.298-12.75L84.299 32 64.002 44.75 43.7 32Zm0 51L23.404 70.25 43.701 57.5 64 70.25 43.702 83Zm20.302-12.75L84.299 57.5l20.298 12.75L84.299 83 64.002 70.25Zm0 29.75L43.7 87.25 64 74.5l20.3 12.75L64.002 100Z"
      />
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
      data-logo="dropbox"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zM18 1.807l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452l-6 3.822zM18 9.452l-6 3.822 6 3.822 6-3.822-6-3.822zM6 18.371l6.001 3.822 6-3.822-6-3.822L6 18.371z" />
    </svg>
  );
  if (variant === "mono") return mono();
  return color();
}
DropboxLogo.brand = "dropbox" as const;
DropboxLogo.title = "Dropbox";

export { DropboxLogo };
