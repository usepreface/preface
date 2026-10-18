/*
 * How people and organizations are drawn when there is no image: initials on one of the five
 * chart colours, picked from the name so the same person always gets the same colour.
 */
const tones = ["bg-chart-1", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-2"] as const;

export type IdentityTone = (typeof tones)[number];

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return (
    letters
      .map((part) => part?.[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}

export function toneOf(name: string): IdentityTone {
  let hash = 0;
  for (const character of name) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return tones[hash % tones.length] ?? tones[0];
}
