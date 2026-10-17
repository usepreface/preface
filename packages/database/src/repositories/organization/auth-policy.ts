import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { OrganizationId, OrganizationMemberId } from "@usepreface/protocol";
import { OrganizationAuthPolicy } from "@usepreface/protocol/model";
import { and, eq, sql } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { organizationAuthPolicy } from "#/schema/organization/auth-policy";

const makeOrganizationAuthPolicyRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(OrganizationAuthPolicy);
  const createDefault = Effect.fn("OrganizationAuthPolicyRepository.createDefault")(function* (
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .insert(organizationAuthPolicy)
      .values({
        organizationId,
        updatedByMemberId: memberId,
        allowedMethods: ["email_code", "email_link"],
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (row === undefined)
      return yield* Effect.die(new Error("Authentication policy insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const findByOrganizationId = Effect.fn("OrganizationAuthPolicyRepository.findByOrganizationId")(
    function* (organizationId: OrganizationId) {
      const [row] = yield* database
        .select()
        .from(organizationAuthPolicy)
        .where(eq(organizationAuthPolicy.organizationId, organizationId));
      return row === undefined ? undefined : decode(row);
    },
    mapToDatabaseError,
  );
  const update = Effect.fn("OrganizationAuthPolicyRepository.update")(function* (
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
    expectedRevision: number,
    settings: Pick<OrganizationAuthPolicy, "allowedMethods" | "ssoMode" | "ssoMaxAgeSeconds">,
  ) {
    const [row] = yield* database
      .update(organizationAuthPolicy)
      .set({
        ...settings,
        revision: sql`${organizationAuthPolicy.revision}+1`,
        updatedByMemberId: memberId,
        updatedAt: DateTime.toDateUtc(yield* DateTime.now),
      })
      .where(
        and(
          eq(organizationAuthPolicy.organizationId, organizationId),
          eq(organizationAuthPolicy.revision, expectedRevision),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const updateGoogle = Effect.fn("OrganizationAuthPolicyRepository.updateGoogle")(function* (
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
    expectedRevision: number,
    googleEnabled: boolean,
    oidcEnabled = false,
  ) {
    const policy = yield* findByOrganizationId(organizationId);
    if (policy === undefined) return undefined;
    return yield* update(organizationId, memberId, expectedRevision, {
      ssoMode: policy.ssoMode,
      ssoMaxAgeSeconds: policy.ssoMaxAgeSeconds,
      allowedMethods: [
        "email_code",
        "email_link",
        ...(googleEnabled ? ["google" as const] : []),
        ...(oidcEnabled ? ["oidc" as const] : []),
      ],
    });
  });
  return { createDefault, findByOrganizationId, update, updateGoogle } as const;
});
export class OrganizationAuthPolicyRepository extends Context.Service<
  OrganizationAuthPolicyRepository,
  Effect.Success<typeof makeOrganizationAuthPolicyRepository>
>()("@usepreface/database/repositories/organization/OrganizationAuthPolicyRepository") {
  static readonly layer = Layer.effect(
    OrganizationAuthPolicyRepository,
    makeOrganizationAuthPolicyRepository,
  );
}
