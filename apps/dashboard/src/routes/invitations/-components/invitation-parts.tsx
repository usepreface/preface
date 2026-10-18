import type { InvitationPreview } from "@usepreface/protocol/dto";
import { InviteSentIllustration } from "@usepreface/ui/illustrations";

import { AuthAside } from "#/components/auth/auth-aside";
import { DetailList } from "#/components/data-display/detail-list";
import { OrgAvatar } from "#/components/organization/org-avatar";
import { formatDate } from "#/lib/dates";

type Preview = typeof InvitationPreview.Type;

export function InvitationAside({ preview }: { preview?: Preview }) {
  if (!preview) {
    return (
      <AuthAside
        art={<InviteSentIllustration className="h-64 w-auto" />}
        title="Your team’s knowledge, together"
        description="Review your invitation, then choose how to sign in."
      />
    );
  }

  // The proof preview deliberately omits member identities, counts and invitation assignments.
  return (
    <div className="flex w-100 max-w-full flex-col items-center gap-4.5 rounded-[20px] border border-border-subtle bg-surface-1 p-7 text-center shadow-lg">
      <OrgAvatar name={preview.organization.name} size="xl" />
      <div className="flex flex-col gap-1">
        <span className="text-heading-2 text-foreground">{preview.organization.name}</span>
        <span className="text-sm text-fg-tertiary">You’re invited to join this organization</span>
      </div>
      <p className="max-w-80 text-sm text-fg-secondary">
        Join your teammates with an email code or an approved identity provider.
      </p>
    </div>
  );
}

export function InvitationDetails({ preview }: { preview: Preview }) {
  return (
    <DetailList
      className="rounded-xl border px-3.5"
      labelWidth="w-32"
      items={[
        { label: "Organization", value: preview.organization.name },
        { label: "Expires", value: formatDate(preview.expiresAt) },
        {
          label: "Sign-in",
          value: preview.ssoRequired ? "Enterprise SSO required" : "Email or an approved provider",
        },
      ]}
    />
  );
}
