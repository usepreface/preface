// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps } from "./logo-props";

function ZendeskLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const label = title ?? "Zendesk";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="#03363D"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="zendesk"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M12.914 2.904V16.29L24 2.905H12.914zM0 2.906C0 5.966 2.483 8.45 5.543 8.45s5.542-2.484 5.543-5.544H0zm11.086 4.807L0 21.096h11.086V7.713zm7.37 7.84c-3.063 0-5.542 2.48-5.542 5.543H24c0-3.06-2.48-5.543-5.543-5.543z" />
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
      data-logo="zendesk"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M12.914 2.904V16.29L24 2.905H12.914zM0 2.906C0 5.966 2.483 8.45 5.543 8.45s5.542-2.484 5.543-5.544H0zm11.086 4.807L0 21.096h11.086V7.713zm7.37 7.84c-3.063 0-5.542 2.48-5.542 5.543H24c0-3.06-2.48-5.543-5.543-5.543z" />
    </svg>
  );
  if (variant === "mono") return mono();
  return color();
}
ZendeskLogo.brand = "zendesk" as const;
ZendeskLogo.title = "Zendesk";

export { ZendeskLogo };
