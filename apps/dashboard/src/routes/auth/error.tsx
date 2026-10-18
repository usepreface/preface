import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { Notice } from "#/components/feedback/notice";
import { apiErrorMessage } from "#/lib/api-errors";
export const Route = createFileRoute("/auth/error")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : "INVALID_FLOW",
  }),
  component: AuthError,
});
function AuthError() {
  const { code } = Route.useSearch();
  return (
    <AuthLayout>
      <AuthHeading title="Sign-in couldn’t finish">Your account has not been changed.</AuthHeading>
      <Notice tone="warning">{apiErrorMessage({ code })}</Notice>
      <Link to="/sign-in">Try signing in again</Link>
      <Link to="/organizations">Your organizations</Link>
    </AuthLayout>
  );
}
