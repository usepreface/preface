import { and, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";

import { account } from "#/schema/auth/account";
import { identityConnection } from "#/schema/auth/identity-connection";
import { sessionAuthentication } from "#/schema/auth/session-authentication";
import { userEmail } from "#/schema/auth/user-email";
import { organizationMember } from "#/schema/organization/member";
import { organization } from "#/schema/organization/organization";

// Both resolution and session listing must honor the current lifecycle of every evidence source.
export const usableSessionEvidenceSource = () =>
  or(
    and(
      isNotNull(userEmail.id),
      isNull(userEmail.removedAt),
      isNotNull(userEmail.verifiedAt),
      eq(userEmail.loginEnabled, true),
    ),
    and(
      inArray(sessionAuthentication.method, ["google", "oidc", "saml"]),
      eq(identityConnection.provider, sessionAuthentication.method),
      or(
        eq(sessionAuthentication.method, "google"),
        and(
          isNotNull(organization.id),
          isNull(organization.archivedAt),
          isNotNull(organizationMember.id),
          isNull(organizationMember.suspendedAt),
          isNull(organizationMember.removedAt),
        ),
      ),
      isNotNull(account.id),
      isNull(account.unlinkedAt),
      eq(identityConnection.status, "active"),
      eq(identityConnection.revision, sessionAuthentication.connectionRevision),
    ),
  );
