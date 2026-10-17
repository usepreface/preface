import { Effect } from "effect";

import { Database } from "@usepreface/database";

export const rejectOrganizationSecurityEmail = Effect.gen(function* () {
  const sql = (yield* Database).$client;
  yield* Effect.acquireRelease(
    sql`create function jobs.reject_test_security_email() returns trigger language plpgsql as $$
      begin
        if new.type = 'organization-security' then
          raise exception 'Security outbox unavailable';
        end if;
        return new;
      end
    $$`,
    () => sql`drop function jobs.reject_test_security_email() cascade`.pipe(Effect.orDie),
  );
  yield* sql`create trigger reject_test_security_email before insert on jobs.email
    for each row execute function jobs.reject_test_security_email()`;
});
