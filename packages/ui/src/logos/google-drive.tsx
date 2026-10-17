// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps } from "./logo-props";

function GoogleDriveLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const label = title ?? "Google Drive";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 87.3 78"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="google-drive"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path
        fill="#0066da"
        d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z"
      />
      <path
        fill="#00ac47"
        d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z"
      />
      <path
        fill="#ea4335"
        d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.798l5.852 11.5z"
      />
      <path
        fill="#00832d"
        d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z"
      />
      <path
        fill="#2684fc"
        d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
      />
      <path
        fill="#ffba00"
        d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z"
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
      data-logo="google-drive"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.861 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a423.93 423.948 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.734 1.85-3.23 1.906-3.323l.104-.167h-7.249z" />
    </svg>
  );
  if (variant === "mono") return mono();
  return color();
}
GoogleDriveLogo.brand = "google-drive" as const;
GoogleDriveLogo.title = "Google Drive";

export { GoogleDriveLogo };
