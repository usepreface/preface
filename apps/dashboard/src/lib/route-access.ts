export function isPublicPath(pathname: string): boolean {
  return /^\/(setup(?:\/|$)|sign-in(?:\/|$)|auth(?:\/|$)|invitations(?:\/|$))/.test(pathname);
}
