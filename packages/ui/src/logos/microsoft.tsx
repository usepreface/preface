// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps } from "./logo-props";

function MicrosoftLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const label = title ?? "Microsoft";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="microsoft"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M11.49 2H2v9.492h9.492V2h-.002z" fill="#F25022" />
      <path d="M22 2h-9.492v9.492H22V2z" fill="#7FBA00" />
      <path d="M11.49 12.508H2V22h9.492v-9.492h-.002z" fill="#00A4EF" />
      <path d="M22 12.508h-9.492V22H22v-9.492z" fill="#FFB900" />
    </svg>
  );
  const mono = (cls?: string) => (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid"
      fill="currentColor"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="microsoft"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path fill="currentColor" d="M121.666 121.666H0V0h121.666z" />
      <path fill="currentColor" d="M256 121.666H134.335V0H256z" />
      <path fill="currentColor" d="M121.663 256.002H0V134.336h121.663z" />
      <path fill="currentColor" d="M256 256.002H134.335V134.336H256z" />
    </svg>
  );
  if (variant === "mono") return mono();
  return color();
}
MicrosoftLogo.brand = "microsoft" as const;
MicrosoftLogo.title = "Microsoft";

export { MicrosoftLogo };
