// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps } from "./logo-props";

function AzureLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const label = title ?? "Azure";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 256 199"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="azure"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path
        d="M118.432 187.698c32.89-5.81 60.055-10.618 60.367-10.684l.568-.12l-31.052-36.935c-17.078-20.314-31.051-37.014-31.051-37.11c0-.182 32.063-88.477 32.243-88.792c.06-.105 21.88 37.567 52.893 91.32c29.035 50.323 52.973 91.815 53.195 92.203l.405.707l-98.684-.012l-98.684-.013l59.8-10.564zM0 176.435c0-.052 14.631-25.451 32.514-56.442l32.514-56.347l37.891-31.799C123.76 14.358 140.867.027 140.935.001c.069-.026-.205.664-.609 1.534s-18.919 40.582-41.145 88.25l-40.41 86.67l-29.386.037c-16.162.02-29.385-.005-29.385-.057z"
        fill="#0089D6"
        fillRule="nonzero"
      />
    </svg>
  );
  const mono = (cls?: string) => (
    <svg
      viewBox="0 0 256 199"
      width={size}
      height={size}
      fill="currentColor"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="azure"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path
        d="M118.432 187.698c32.89-5.81 60.055-10.618 60.367-10.684l.568-.12l-31.052-36.935c-17.078-20.314-31.051-37.014-31.051-37.11c0-.182 32.063-88.477 32.243-88.792c.06-.105 21.88 37.567 52.893 91.32c29.035 50.323 52.973 91.815 53.195 92.203l.405.707l-98.684-.012l-98.684-.013l59.8-10.564zM0 176.435c0-.052 14.631-25.451 32.514-56.442l32.514-56.347l37.891-31.799C123.76 14.358 140.867.027 140.935.001c.069-.026-.205.664-.609 1.534s-18.919 40.582-41.145 88.25l-40.41 86.67l-29.386.037c-16.162.02-29.385-.005-29.385-.057z"
        fill="currentColor"
        fillRule="nonzero"
      />
    </svg>
  );
  if (variant === "mono") return mono();
  return color();
}
AzureLogo.brand = "azure" as const;
AzureLogo.title = "Azure";

export { AzureLogo };
