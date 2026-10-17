/** 12400 → "12.4k". */
export function formatStars(stars: number) {
  if (stars < 1000) {
    return String(stars);
  }
  return `${(stars / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}
