import type { SessionAuthentication } from "@usepreface/protocol/model";

// Organization-owned providers establish scoped trust, not installation administration authority.
export const isLocalEmailAuthentication = (method: SessionAuthentication["method"]) =>
  method === "bootstrap_email_code" || method === "email_code" || method === "email_link";

export const isInstallationAuthentication = (method: SessionAuthentication["method"]) =>
  isLocalEmailAuthentication(method) || method === "google";
