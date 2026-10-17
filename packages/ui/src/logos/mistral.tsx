// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps } from "./logo-props";

function MistralLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const label = title ?? "Mistral";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="mistral"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M3.428 3.4h3.429v3.428H3.428V3.4zm13.714 0h3.43v3.428h-3.43V3.4z" fill="gold" />
      <path
        d="M3.428 6.828h6.857v3.429H3.429V6.828zm10.286 0h6.857v3.429h-6.857V6.828z"
        fill="#FFAF00"
      />
      <path d="M3.428 10.258h17.144v3.428H3.428v-3.428z" fill="#FF8205" />
      <path
        d="M3.428 13.686h3.429v3.428H3.428v-3.428zm6.858 0h3.429v3.428h-3.429v-3.428zm6.856 0h3.43v3.428h-3.43v-3.428z"
        fill="#FA500F"
      />
      <path d="M0 17.114h10.286v3.429H0v-3.429zm13.714 0H24v3.429H13.714v-3.429z" fill="#E10500" />
    </svg>
  );
  const mono = (cls?: string) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      fillRule="evenodd"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="mistral"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path
        clipRule="evenodd"
        d="M3.428 3.4h3.429v3.428h3.429v3.429h-.002 3.431V6.828h3.427V3.4h3.43v13.714H24v3.429H13.714v-3.428h-3.428v-3.429h-3.43v3.428h3.43v3.429H0v-3.429h3.428V3.4zm10.286 13.715h3.428v-3.429h-3.427v3.429z"
      />
    </svg>
  );
  if (variant === "mono") return mono();
  return color();
}
MistralLogo.brand = "mistral" as const;
MistralLogo.title = "Mistral";

export { MistralLogo };
