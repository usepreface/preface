import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/*
 * tailwind-merge needs to know about the Preface text-style utilities, otherwise
 * `text-body-md text-fg` would be read as two conflicting font sizes or colours.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-2xl",
            "display-xl",
            "display-lg",
            "display-md",
            "heading-1",
            "heading-2",
            "heading-3",
            "heading-4",
            "body-lg",
            "body-md",
            "body-sm",
            "caption",
            "overline",
            "mono-md",
            "mono-sm",
            "mono-xs",
            "2xs",
            "13",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
