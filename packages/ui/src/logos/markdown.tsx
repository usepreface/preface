// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps } from "./logo-props";

function MarkdownLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const label = title ?? "Markdown";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 208 128"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="markdown"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <g fill="#000">
        <path
          fillRule="evenodd"
          d="M15 10a5 5 0 0 0-5 5v98a5 5 0 0 0 5 5h178a5 5 0 0 0 5-5V15a5 5 0 0 0-5-5zM0 15A15 15 0 0 1 15 0h178a15 15 0 0 1 15 15v98a15 15 0 0 1-15 15H15a15 15 0 0 1-15-15z"
          clipRule="evenodd"
        />
        <path d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0-30-33h20V30h20v35h20z" />
      </g>
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
      data-logo="markdown"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path d="M22.27 19.385H1.73A1.73 1.73 0 010 17.655V6.345a1.73 1.73 0 011.73-1.73h20.54A1.73 1.73 0 0124 6.345v11.308a1.73 1.73 0 01-1.73 1.731zM5.769 15.923v-4.5l2.308 2.885 2.307-2.885v4.5h2.308V8.078h-2.308l-2.307 2.885-2.308-2.885H3.46v7.847zM21.232 12h-2.309V8.077h-2.307V12h-2.308l3.461 4.039z" />
    </svg>
  );
  const onLight = (cls?: string) => (
    <svg
      viewBox="0 0 208 128"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="markdown"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <g fill="#000">
        <path
          fillRule="evenodd"
          d="M15 10a5 5 0 0 0-5 5v98a5 5 0 0 0 5 5h178a5 5 0 0 0 5-5V15a5 5 0 0 0-5-5zM0 15A15 15 0 0 1 15 0h178a15 15 0 0 1 15 15v98a15 15 0 0 1-15 15H15a15 15 0 0 1-15-15z"
          clipRule="evenodd"
        />
        <path d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0-30-33h20V30h20v35h20z" />
      </g>
    </svg>
  );
  const onDark = (cls?: string) => (
    <svg
      viewBox="0 0 208 128"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="markdown"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <path
        fill="none"
        stroke="#FFF"
        strokeWidth="10"
        d="M15 5h178a10 10 0 0 1 10 10v98a10 10 0 0 1-10 10H15a10 10 0 0 1-10-10V15A10 10 0 0 1 15 5z"
      />
      <path
        fill="#FFF"
        d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39H30zm125 0-30-33h20V30h20v35h20l-30 33z"
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
MarkdownLogo.brand = "markdown" as const;
MarkdownLogo.title = "Markdown";

export { MarkdownLogo };
