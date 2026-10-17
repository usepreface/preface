// Generated from thesvg.org (https://thesvg.org). Brand marks belong to their owners;
// follow each company's brand guidelines when using them.
import { cn } from "../lib/utils";
import { type LogoProps, useLogoId } from "./logo-props";

function GeminiLogo({ variant = "auto", size = 16, title, className, ...props }: LogoProps) {
  const id = useLogoId();
  const label = title ?? "Gemini";
  const color = (cls?: string) => (
    <svg
      viewBox="0 0 296 298"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="gemini"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <mask id={`${id}a`} x="0" y="0" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }}>
        <path
          fill="#3186FF"
          d="M141.201 4.886c2.282-6.17 11.042-6.071 13.184.148l5.985 17.37a184.004 184.004 0 0 0 111.257 113.049l19.304 6.997c6.143 2.227 6.156 10.91.02 13.155l-19.35 7.082a184.001 184.001 0 0 0-109.495 109.385l-7.573 20.629c-2.241 6.105-10.869 6.121-13.133.025l-7.908-21.296a184 184 0 0 0-109.02-108.658l-19.698-7.239c-6.102-2.243-6.118-10.867-.025-13.132l20.083-7.467A183.998 183.998 0 0 0 133.291 26.28l7.91-21.394Z"
        />
      </mask>
      <g mask={`url(#${id}a)`}>
        <g filter={`url(#${id}b)`}>
          <ellipse cx="163" cy="149" fill="#3689FF" rx="196" ry="159" />
        </g>
        <g filter={`url(#${id}c)`}>
          <ellipse cx="33.5" cy="142.5" fill="#F6C013" rx="68.5" ry="72.5" />
        </g>
        <g filter={`url(#${id}d)`}>
          <ellipse cx="19.5" cy="148.5" fill="#F6C013" rx="68.5" ry="72.5" />
        </g>
        <g filter={`url(#${id}e)`}>
          <path fill="#FA4340" d="M194 10.5C172 82.5 65.5 134.333 22.5 135L144-66l50 76.5Z" />
        </g>
        <g filter={`url(#${id}f)`}>
          <path fill="#FA4340" d="M190.5-12.5C168.5 59.5 62 111.333 19 112L140.5-89l50 76.5Z" />
        </g>
        <g filter={`url(#${id}g)`}>
          <path fill="#14BB69" d="M194.5 279.5C172.5 207.5 66 155.667 23 155l121.5 201 50-76.5Z" />
        </g>
        <g filter={`url(#${id}h)`}>
          <path fill="#14BB69" d="M196.5 320.5C174.5 248.5 68 196.667 25 196l121.5 201 50-76.5Z" />
        </g>
      </g>
      <defs>
        <filter
          id={`${id}b`}
          x="-69"
          y="-46"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="18" />
        </filter>
        <filter
          id={`${id}c`}
          x="-99"
          y="6"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32" />
        </filter>
        <filter
          id={`${id}d`}
          x="-113"
          y="12"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32" />
        </filter>
        <filter
          id={`${id}e`}
          x="-41.5"
          y="-130"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32" />
        </filter>
        <filter
          id={`${id}f`}
          x="-45"
          y="-153"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32" />
        </filter>
        <filter
          id={`${id}g`}
          x="-41"
          y="91"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32" />
        </filter>
        <filter
          id={`${id}h`}
          x="-39"
          y="132"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32" />
        </filter>
      </defs>
    </svg>
  );
  const mono = (cls?: string) => (
    <svg
      viewBox="0 0 296 298"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={label}
      data-slot="logo"
      data-logo="gemini"
      className={cn("shrink-0", className, cls)}
      {...props}
    >
      <title>{label}</title>
      <mask id={`${id}a`} x="0" y="0" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }}>
        <path
          fill="currentColor"
          d="M141.201 4.886c2.282-6.17 11.042-6.071 13.184.148l5.985 17.37a184.004 184.004 0 0 0 111.257 113.049l19.304 6.997c6.143 2.227 6.156 10.91.02 13.155l-19.35 7.082a184.001 184.001 0 0 0-109.495 109.385l-7.573 20.629c-2.241 6.105-10.869 6.121-13.133.025l-7.908-21.296a184 184 0 0 0-109.02-108.658l-19.698-7.239c-6.102-2.243-6.118-10.867-.025-13.132l20.083-7.467A183.998 183.998 0 0 0 133.291 26.28l7.91-21.394Z"
        />
      </mask>
      <g mask={`url(#${id}a)`}>
        <g filter={`url(#${id}b)`}>
          <ellipse cx="163" cy="149" fill="currentColor" rx="196" ry="159" />
        </g>
        <g filter={`url(#${id}c)`}>
          <ellipse cx="33.5" cy="142.5" fill="currentColor" rx="68.5" ry="72.5" />
        </g>
        <g filter={`url(#${id}d)`}>
          <ellipse cx="19.5" cy="148.5" fill="currentColor" rx="68.5" ry="72.5" />
        </g>
        <g filter={`url(#${id}e)`}>
          <path fill="currentColor" d="M194 10.5C172 82.5 65.5 134.333 22.5 135L144-66l50 76.5Z" />
        </g>
        <g filter={`url(#${id}f)`}>
          <path
            fill="currentColor"
            d="M190.5-12.5C168.5 59.5 62 111.333 19 112L140.5-89l50 76.5Z"
          />
        </g>
        <g filter={`url(#${id}g)`}>
          <path
            fill="currentColor"
            d="M194.5 279.5C172.5 207.5 66 155.667 23 155l121.5 201 50-76.5Z"
          />
        </g>
        <g filter={`url(#${id}h)`}>
          <path
            fill="currentColor"
            d="M196.5 320.5C174.5 248.5 68 196.667 25 196l121.5 201 50-76.5Z"
          />
        </g>
      </g>
      <defs>
        <filter
          id={`${id}b`}
          x="-69"
          y="-46"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="18" />
        </filter>
        <filter
          id={`${id}c`}
          x="-99"
          y="6"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32" />
        </filter>
        <filter
          id={`${id}d`}
          x="-113"
          y="12"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32" />
        </filter>
        <filter
          id={`${id}e`}
          x="-41.5"
          y="-130"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32" />
        </filter>
        <filter
          id={`${id}f`}
          x="-45"
          y="-153"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32" />
        </filter>
        <filter
          id={`${id}g`}
          x="-41"
          y="91"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32" />
        </filter>
        <filter
          id={`${id}h`}
          x="-39"
          y="132"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32" />
        </filter>
      </defs>
    </svg>
  );
  if (variant === "mono") return mono();
  return color();
}
GeminiLogo.brand = "gemini" as const;
GeminiLogo.title = "Gemini";

export { GeminiLogo };
