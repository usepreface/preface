import { Effect } from "effect";

import { Database } from "@usepreface/database";

// Fail real storage after the business writes, rather than replacing repositories.
export const rejectLifecycleAudit = Effect.gen(function* () {
  const sql = (yield* Database).$client;
  yield* Effect.acquireRelease(
    sql`create function audit.reject_test_lifecycle() returns trigger language plpgsql as $$
      begin
        if new.event_type in ('instance.bootstrap_completed', 'instance.bootstrap_verification_requested', 'auth.session_revoked', 'auth.session_authenticated', 'auth.email_sign_in_requested', 'organization.created', 'organization.updated', 'organization.role_archived', 'organization.member_removed', 'organization.ownership_transferred', 'organization.invitation_created', 'organization.invitation_accepted') then
          raise exception 'Lifecycle audit unavailable';
        end if;
        return new;
      end
    $$`,
    () => sql`drop function audit.reject_test_lifecycle() cascade`.pipe(Effect.orDie),
  );
  yield* sql`create trigger reject_test_lifecycle before insert on audit.event
    for each row execute function audit.reject_test_lifecycle()`;
});
