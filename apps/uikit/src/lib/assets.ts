import { toast } from "@usepreface/ui/components/sonner";

/** Copy text and confirm with a toast. */
export async function copyText(value: string, label = "Copied to clipboard") {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(label, { description: value.length > 80 ? `${value.slice(0, 80)}…` : value });
    return true;
  } catch {
    toast.error("Couldn't copy", { description: "The browser blocked clipboard access." });
    return false;
  }
}

/** The first SVG in `root` that is actually rendered (auto-themed art renders a light and a dark copy). */
export function visibleSvg(root: Element | null): SVGSVGElement | null {
  if (!root) {
    return null;
  }
  const all =
    root instanceof SVGSVGElement
      ? [root]
      : Array.from(
          root.querySelectorAll<SVGSVGElement>(":scope svg:not(svg svg):not([data-slot=pattern])"),
        );
  return all.find((el) => el.getBoundingClientRect().width > 0) ?? all[0] ?? null;
}

const CSS_VAR_FONT = /var\(--font-(display|sans|mono)\)/g;
const FONTS: Record<string, string> = {
  display: "'Space Grotesk', sans-serif",
  sans: "Geist, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/** A standalone SVG document for an on-page SVG: resolves currentColor and sizes, drops classes. */
export function serializeSvg(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const box = svg.getBoundingClientRect();
  const color = getComputedStyle(svg).color;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(Math.round(box.width)));
  clone.setAttribute("height", String(Math.round(box.height)));
  clone.removeAttribute("class");
  clone.removeAttribute("style");
  clone.removeAttribute("aria-hidden");
  for (const el of clone.querySelectorAll("[class]")) {
    el.removeAttribute("class");
  }
  return new XMLSerializer()
    .serializeToString(clone)
    .replace(/currentColor/g, color)
    .replace(CSS_VAR_FONT, (_, f: string) => FONTS[f] ?? "sans-serif");
}

function save(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvg(root: Element | null, name: string) {
  const svg = visibleSvg(root);
  if (!svg) {
    toast.error("Nothing to download");
    return;
  }
  save(new Blob([serializeSvg(svg)], { type: "image/svg+xml" }), `${name}.svg`);
  toast.success(`Downloaded ${name}.svg`);
}

/** Rasterise at `scale` × the on-page size (2× by default, at least 512px on the long side). */
export async function downloadPng(root: Element | null, name: string, scale = 2) {
  const svg = visibleSvg(root);
  if (!svg) {
    toast.error("Nothing to download");
    return;
  }
  const markup = serializeSvg(svg);
  const box = svg.getBoundingClientRect();
  const k = Math.max(scale, 512 / Math.max(box.width, box.height, 1));
  const img = new Image();
  img.decoding = "async";
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  try {
    await img.decode();
  } catch {
    toast.error("Couldn't render the PNG");
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(box.width * k);
  canvas.height = Math.round(box.height * k);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  canvas.toBlob((blob) => {
    if (blob) {
      save(blob, `${name}.png`);
      toast.success(`Downloaded ${name}.png`, {
        description: `${canvas.width} × ${canvas.height}`,
      });
    }
  }, "image/png");
}

export const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
