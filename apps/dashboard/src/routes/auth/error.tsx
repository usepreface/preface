import { createFileRoute, Link } from "@tanstack/react-router";

import { ShieldIcon } from "@usepreface/ui/icons";

import { AuthHeading } from "#/components/auth/auth-layout";
import { StatusPage, StatusIcon } from "#/components/auth/status-page";
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
    <StatusPage width="lg">
      <StatusIcon icon={ShieldIcon} tone="warning" />
      <AuthHeading align="center" title="Sign-in couldn’t finish">
        Your account has not been changed.
      </AuthHeading>
      <Notice tone="warning">{apiErrorMessage({ code })}</Notice>
      <Link to="/sign-in">Try signing in again</Link>
      <Link to="/organizations">Your organizations</Link>
    </StatusPage>
  );
}
