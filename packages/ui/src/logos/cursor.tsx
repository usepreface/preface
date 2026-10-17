// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps } from "./logo-props";

function CursorLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const label = title ?? "Cursor";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 466.73 532.09"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="cursor"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <defs>
        <style>{".st0 {\n        fill: #26251e;\n      }"}</style>
      </defs>
      <path
        className="st0"
        d="M457.43,125.94L244.42,2.96c-6.84-3.95-15.28-3.95-22.12,0L9.3,125.94c-5.75,3.32-9.3,9.46-9.3,16.11v247.99c0,6.65,3.55,12.79,9.3,16.11l213.01,122.98c6.84,3.95,15.28,3.95,22.12,0l213.01-122.98c5.75-3.32,9.3-9.46,9.3-16.11v-247.99c0-6.65-3.55-12.79-9.3-16.11h-.01ZM444.05,151.99l-205.63,356.16c-1.39,2.4-5.06,1.42-5.06-1.36v-233.21c0-4.66-2.49-8.97-6.53-11.31L24.87,145.67c-2.4-1.39-1.42-5.06,1.36-5.06h411.26c5.84,0,9.49,6.33,6.57,11.39h-.01Z"
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
      data-logo="cursor"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" />
    </svg>
  );
  const onLight = (cls?: string) => (
    <svg
      viewBox="0 0 466.73 532.09"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="cursor"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <defs>
        <style>{".st0 {\n        fill: #26251e;\n      }"}</style>
      </defs>
      <path
        className="st0"
        d="M457.43,125.94L244.42,2.96c-6.84-3.95-15.28-3.95-22.12,0L9.3,125.94c-5.75,3.32-9.3,9.46-9.3,16.11v247.99c0,6.65,3.55,12.79,9.3,16.11l213.01,122.98c6.84,3.95,15.28,3.95,22.12,0l213.01-122.98c5.75-3.32,9.3-9.46,9.3-16.11v-247.99c0-6.65-3.55-12.79-9.3-16.11h-.01ZM444.05,151.99l-205.63,356.16c-1.39,2.4-5.06,1.42-5.06-1.36v-233.21c0-4.66-2.49-8.97-6.53-11.31L24.87,145.67c-2.4-1.39-1.42-5.06,1.36-5.06h411.26c5.84,0,9.49,6.33,6.57,11.39h-.01Z"
      />
    </svg>
  );
  const onDark = (cls?: string) => (
    <svg
      viewBox="0 0 466.73 532.09"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="cursor"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <defs>
        <style>{".st0 {\n        fill: #edecec;\n      }"}</style>
      </defs>
      <path
        className="st0"
        d="M457.43,125.94L244.42,2.96c-6.84-3.95-15.28-3.95-22.12,0L9.3,125.94c-5.75,3.32-9.3,9.46-9.3,16.11v247.99c0,6.65,3.55,12.79,9.3,16.11l213.01,122.98c6.84,3.95,15.28,3.95,22.12,0l213.01-122.98c5.75-3.32,9.3-9.46,9.3-16.11v-247.99c0-6.65-3.55-12.79-9.3-16.11h-.01ZM444.05,151.99l-205.63,356.16c-1.39,2.4-5.06,1.42-5.06-1.36v-233.21c0-4.66-2.49-8.97-6.53-11.31L24.87,145.67c-2.4-1.39-1.42-5.06,1.36-5.06h411.26c5.84,0,9.49,6.33,6.57,11.39h-.01Z"
      />
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
CursorLogo.brand = "cursor" as const;
CursorLogo.title = "Cursor";

export { CursorLogo };
