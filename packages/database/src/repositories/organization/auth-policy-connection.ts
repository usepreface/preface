import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";

import type {
  IdentityConnectionId,
  OrganizationId,
  OrganizationMemberId,
} from "@usepreface/protocol";
import { OrganizationAuthPolicyConnection } from "@usepreface/protocol/model";
import { eq } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { organizationAuthPolicyConnection as table } from "#/schema/organization/auth-policy-connection";

const makeRepository = Effect.gen(function* () {
  const database = yield* Database;
  const listByOrganization = Effect.fn("AuthPolicyConnectionRepository.listByOrganization")(
    function* (organizationId: OrganizationId) {
      const rows = yield* database
        .select()
        .from(table)
        .where(eq(table.organizationId, organizationId))
        .orderBy(table.identityConnectionId);
      return rows.map((row) => Schema.decodeUnknownSync(OrganizationAuthPolicyConnection)(row));
    },
    mapToDatabaseError,
  );
  const replaceForOrganization = Effect.fn("AuthPolicyConnectionRepository.replaceForOrganization")(
    function* (
      organizationId: OrganizationId,
      memberId: OrganizationMemberId,
      connectionIds: readonly IdentityConnectionId[],
    ) {
      if (Option.isNone(yield* Effect.serviceOption(database.$client.transactionService)))
        return yield* Effect.die(
          new Error("Policy connection replacement requires TransactionService.run"),
        );
      yield* database.delete(table).where(eq(table.organizationId, organizationId));
      if (connectionIds.length > 0) {
        const createdAt = DateTime.toDateUtc(yield* DateTime.now);
        yield* database.insert(table).values(
          connectionIds.map((identityConnectionId) => ({
            organizationId,
            identityConnectionId,
            createdByMemberId: memberId,
            createdAt,
          })),
        );
      }
    },
    mapToDatabaseError,
  );
  return { listByOrganization, replaceForOrganization };
});
export class OrganizationAuthPolicyConnectionRepository extends Context.Service<
  OrganizationAuthPolicyConnectionRepository,
  Effect.Success<typeof makeRepository>
>()("@usepreface/database/OrganizationAuthPolicyConnectionRepository") {
  static readonly layer = Layer.effect(OrganizationAuthPolicyConnectionRepository, makeRepository);
}
