import { Predicate } from "effect";

import { toast } from "@usepreface/ui/components/sonner";

export function errorCode(error: unknown): string | undefined {
  return Predicate.isObject(error) && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
}

export function isAccessRejection(error: unknown): boolean {
  return [
    "UNAUTHENTICATED",
    "FORBIDDEN",
    "NOT_AUTHORIZED",
    "AUTHENTICATION_REQUIRED",
    "MEMBER_NOT_ACTIVE",
    "ORGANIZATION_NOT_FOUND",
  ].includes(errorCode(error) ?? "");
}

const messages: Readonly<Record<string, string>> = {
  UNAUTHENTICATED: "Your session has expired. Sign in again.",

  ALREADY_COMPLETED: "This instance is already set up. Sign in to continue.",
  INVALID_CODE: "That code does not match or has expired. Use the latest email or resend it.",
  VERIFICATION_RATE_LIMITED: "Wait until the resend cooldown ends before requesting another code.",
  SSO_AUTHENTICATION_REQUIRED:
    "Sign in with an approved SSO connection to satisfy the login policy.",
  AUTHENTICATION_REQUIRED: "Complete the organization’s required authentication before continuing.",
  INVALID_RECOVERY_CREDENTIAL: "This recovery credential is invalid, revoked or already consumed.",
  RECOVERY_CREDENTIAL_REQUIRED: "Prepare and supply an offline recovery credential first.",
  CONNECTION_NOT_TESTED: "Test this exact saved revision before activating it.",
  ROLE_KEY_UNAVAILABLE: "That role key is already in use. Choose another key.",
  ROLE_NOT_ASSIGNABLE: "Your current permissions do not allow that role assignment.",
  LAST_OWNER: "Keep at least one active organization owner.",
  LAST_AUTHENTICATION_PATH: "Keep a usable sign-in and recovery path for an owner.",
  INVALID_INVITATION: "This invitation is invalid, expired or replaced. Ask for a new invitation.",
  INVALID_FLOW: "This sign-in flow expired or was already used. Start sign-in again.",
  INVALID_PROOF: "This code or link is invalid or expired. Request a new one.",
  INVALID_TOKEN: "This setup link is invalid or expired. Request a new link from the operator CLI.",
  SLUG_UNAVAILABLE: "That URL is already in use. Choose another one.",
  REVISION_CONFLICT: "This configuration changed. Refresh and try again.",
  ALREADY_AUTHENTICATED:
    "You are already signed in. Continue to the dashboard or sign out to use another account.",
  ACCOUNT_MISMATCH: "This invitation belongs to a different account. Sign out and open it again.",
  MEMBER_NOT_ACTIVE: "Your organization membership is suspended or removed.",
  DOMAIN_VERIFICATION_FAILED:
    "The exact DNS TXT record was not found. Check the record and allow time for propagation.",
  INVALID_CONFIGURATION: "Check the provider configuration and try again.",
  CONNECTION_UNAVAILABLE:
    "This connection is unavailable. Check its activation and organization policy.",
  FORBIDDEN: "You do not have permission to do this.",
};

export function apiErrorMessage(error: unknown): string {
  return (
    messages[errorCode(error) ?? ""] ?? "The request could not be completed. Refresh and try again."
  );
}

// Never print client errors: validation defects can contain write-only credentials.
export function showApiError(error: unknown) {
  toast.error("Couldn’t complete the request", {
    description: apiErrorMessage(error),
  });
}
