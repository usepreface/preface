export function safeReturnPath(destination: string, fallback = "/organizations"): string {
  try {
    const url = new URL(destination, window.location.origin);
    if (
      url.origin !== window.location.origin ||
      !url.pathname.startsWith("/") ||
      url.username ||
      url.password
    )
      return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
