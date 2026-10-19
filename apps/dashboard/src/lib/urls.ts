export function instanceUrl(path: string): string {
  return new URL(path, import.meta.env.VITE_API_URL || window.location.origin).href;
}
