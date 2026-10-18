import { Schema } from "effect";

import { OrganizationInvitationId } from "@usepreface/protocol";

import type { Infrastructure } from "./infrastructure.js";

export async function ageInvitationDelivery(
  infrastructure: Infrastructure,
  database: string,
  invitationId: string,
) {
  const id = Schema.decodeUnknownSync(OrganizationInvitationId)(invitationId);
  return infrastructure.postgres.exec([
    "psql",
    "-U",
    "preface_test",
    "-d",
    database,
    "-c",
    `UPDATE jobs.email SET sent_at = now() - interval '11 minutes' WHERE id = (SELECT email_job_id FROM organization.invitation WHERE id = '${id}')`,
  ]);
}
