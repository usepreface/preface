import { DateTime } from "effect";
export function formatDate(value: DateTime.Utc | null | undefined): string {
  return value
    ? DateTime.toDateUtc(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
}
