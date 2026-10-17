// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps, useLogoId } from "./logo-props";

function NextjsLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const id = useLogoId();
  const label = title ?? "Next.js";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="nextjs"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <defs>
        <linearGradient id={`${id}SVGrDou6dwg`} x1="55.633%" x2="83.228%" y1="56.385%" y2="96.08%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}SVG9onTObtB`} x1="50%" x2="49.953%" y1="0%" y2="73.438%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <circle id={`${id}SVGN5eQqeMK`} cx="128" cy="128" r="128" />
      </defs>
      <mask id={`${id}SVGMX2wGdvm`} fill="#fff">
        <use href={`#${id}SVGN5eQqeMK`} />
      </mask>
      <g mask={`url(#${id}SVGMX2wGdvm)`}>
        <circle cx="128" cy="128" r="128" />
        <path
          fill={`url(#${id}SVGrDou6dwg)`}
          d="M212.634 224.028L98.335 76.8H76.8v102.357h17.228V98.68L199.11 234.446a128 128 0 0 0 13.524-10.418"
        />
        <path fill={`url(#${id}SVG9onTObtB)`} d="M163.556 76.8h17.067v102.4h-17.067z" />
      </g>
    </svg>
  );
  const mono = (cls?: string) => (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="currentColor"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="nextjs"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <defs>
        <linearGradient id={`${id}SVGrDou6dwg`} x1="55.633%" x2="83.228%" y1="56.385%" y2="96.08%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}SVG9onTObtB`} x1="50%" x2="49.953%" y1="0%" y2="73.438%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <circle id={`${id}SVGN5eQqeMK`} cx="128" cy="128" r="128" />
      </defs>
      <mask id={`${id}SVGMX2wGdvm`} fill="currentColor">
        <use href={`#${id}SVGN5eQqeMK`} />
      </mask>
      <g mask={`url(#${id}SVGMX2wGdvm)`}>
        <circle cx="128" cy="128" r="128" />
        <path
          fill={`url(#${id}SVGrDou6dwg)`}
          d="M212.634 224.028L98.335 76.8H76.8v102.357h17.228V98.68L199.11 234.446a128 128 0 0 0 13.524-10.418"
        />
        <path fill={`url(#${id}SVG9onTObtB)`} d="M163.556 76.8h17.067v102.4h-17.067z" />
      </g>
    </svg>
  );
  if (variant === "mono") return mono();
  return color();
}
NextjsLogo.brand = "nextjs" as const;
NextjsLogo.title = "Next.js";

export { NextjsLogo };
