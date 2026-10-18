import type {
  ConnectionStatus,
  DeliveryStatus,
  DomainApproval,
  DomainStatus,
  InvitationStatus,
  MemberStatus,
} from "#/lib/placeholder";

/*
 * How each lifecycle state reads in a badge. One table per domain, so a status always has the
 * same label and colour wherever it appears.
 */
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";
export type StatusLook = { label: string; tone: StatusTone; dot?: boolean };

export const memberStatus: Record<MemberStatus, StatusLook> = {
  active: { label: "Active", tone: "success", dot: true },
  suspended: { label: "Suspended", tone: "warning", dot: true },
  removed: { label: "Removed", tone: "neutral", dot: true },
};

export const invitationStatus: Record<InvitationStatus, StatusLook> = {
  pending: { label: "Pending", tone: "info", dot: true },
  accepted: { label: "Accepted", tone: "success", dot: true },
  expired: { label: "Expired", tone: "neutral", dot: true },
  revoked: { label: "Revoked", tone: "danger", dot: true },
};

export const deliveryStatus: Record<DeliveryStatus, StatusLook> = {
  pending: { label: "Queued", tone: "neutral" },
  processing: { label: "Sending", tone: "info" },
  sent: { label: "Delivered", tone: "success" },
  failed: { label: "Bounced", tone: "danger" },
};

export const connectionStatus: Record<ConnectionStatus, StatusLook> = {
  draft: { label: "Draft", tone: "neutral", dot: true },
  tested: { label: "Tested", tone: "info", dot: true },
  active: { label: "Active", tone: "success", dot: true },
  disabled: { label: "Disabled", tone: "neutral", dot: true },
};

export const domainStatus: Record<DomainStatus, StatusLook> = {
  verified: { label: "Verified", tone: "success", dot: true },
  pending: { label: "Pending", tone: "info", dot: true },
  expired: { label: "Expired", tone: "neutral", dot: true },
};

export const domainApproval: Record<DomainApproval, StatusLook> = {
  approved: { label: "Approved", tone: "success", dot: true },
  awaiting: { label: "Awaiting approval", tone: "warning", dot: true },
  none: { label: "Not approved", tone: "neutral", dot: true },
};

export const organizationStatus: Record<"active" | "archived", StatusLook> = {
  active: { label: "Active", tone: "success", dot: true },
  archived: { label: "Archived", tone: "neutral", dot: true },
};
