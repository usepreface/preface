import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type {
  OrganizationId,
  OrganizationMemberId,
  OrganizationRoleId,
  OrganizationRoleBindingId,
} from "@usepreface/protocol";
import {
  GrantOrganizationRole,
  OrganizationMember,
  OrganizationRole,
  OrganizationRoleBinding,
} from "@usepreface/protocol/model";
import { and, eq, exists, inArray, isNotNull, isNull } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { user } from "#/schema/auth/user";
import { userEmail } from "#/schema/auth/user-email";
import { organizationMember } from "#/schema/organization/member";
import { organizationRole } from "#/schema/organization/role";
import { organizationRoleBinding } from "#/schema/organization/role-binding";

const makeOrganizationRoleBindingRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(OrganizationRoleBinding);
  const findById = Effect.fn("OrganizationRoleBindingRepository.findById")(function* (
    organizationId: OrganizationId,
    id: OrganizationRoleBindingId,
  ) {
    const [row] = yield* database
      .select()
      .from(organizationRoleBinding)
      .where(
        and(
          eq(organizationRoleBinding.organizationId, organizationId),
          eq(organizationRoleBinding.id, id),
        ),
      );
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const grant = Effect.fn("OrganizationRoleBindingRepository.grant")(function* (
    input: GrantOrganizationRole,
  ) {
    const [inserted] = yield* database
      .insert(organizationRoleBinding)
      .values({
        ...Schema.encodeSync(GrantOrganizationRole)(input),
        organizationId: input.organizationId,
        roleId: input.roleId,
        memberId: input.memberId,
        grantedByMemberId: input.grantedByMemberId,
        createdAt: DateTime.toDateUtc(yield* DateTime.now),
      })
      .onConflictDoNothing({
        target: [
          organizationRoleBinding.organizationId,
          organizationRoleBinding.roleId,
          organizationRoleBinding.memberId,
        ],
        where: isNull(organizationRoleBinding.revokedAt),
      })
      .returning();
    if (inserted !== undefined) return { binding: decode(inserted), created: true } as const;
    const [existing] = yield* database
      .select()
      .from(organizationRoleBinding)
      .where(
        and(
          eq(organizationRoleBinding.organizationId, input.organizationId),
          eq(organizationRoleBinding.roleId, input.roleId),
          eq(organizationRoleBinding.memberId, input.memberId),
          isNull(organizationRoleBinding.revokedAt),
        ),
      );
    if (existing === undefined)
      return yield* Effect.die(new Error("Conflicting role grant disappeared"));
    return { binding: decode(existing), created: false } as const;
  }, mapToDatabaseError);
  const listActiveByMemberIds = Effect.fn(
    "OrganizationRoleBindingRepository.listActiveByMemberIds",
  )(function* (organizationId: OrganizationId, memberIds: readonly OrganizationMemberId[]) {
    if (memberIds.length === 0) return [];
    const rows = yield* database
      .select({ binding: organizationRoleBinding, role: organizationRole })
      .from(organizationRoleBinding)
      .innerJoin(organizationRole, eq(organizationRole.id, organizationRoleBinding.roleId))
      .where(
        and(
          eq(organizationRoleBinding.organizationId, organizationId),
          inArray(organizationRoleBinding.memberId, memberIds),
          isNull(organizationRoleBinding.revokedAt),
          isNull(organizationRole.archivedAt),
        ),
      );
    return rows.map((row) => ({
      binding: decode(row.binding),
      role: Schema.decodeUnknownSync(OrganizationRole)(row.role),
    }));
  }, mapToDatabaseError);
  const listActiveByMemberId = Effect.fn("OrganizationRoleBindingRepository.listActiveByMemberId")(
    (organizationId: OrganizationId, memberId: OrganizationMemberId) =>
      listActiveByMemberIds(organizationId, [memberId]),
  );
  const revoke = Effect.fn("OrganizationRoleBindingRepository.revoke")(function* (
    organizationId: OrganizationId,
    id: OrganizationRoleBindingId,
  ) {
    const [row] = yield* database
      .update(organizationRoleBinding)
      .set({ revokedAt: DateTime.toDateUtc(yield* DateTime.now) })
      .where(
        and(
          eq(organizationRoleBinding.organizationId, organizationId),
          eq(organizationRoleBinding.id, id),
          isNull(organizationRoleBinding.revokedAt),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const revokeAllByMemberId = Effect.fn("OrganizationRoleBindingRepository.revokeAllByMemberId")(
    function* (organizationId: OrganizationId, memberId: OrganizationMemberId) {
      const rows = yield* database
        .update(organizationRoleBinding)
        .set({ revokedAt: DateTime.toDateUtc(yield* DateTime.now) })
        .where(
          and(
            eq(organizationRoleBinding.organizationId, organizationId),
            eq(organizationRoleBinding.memberId, memberId),
            isNull(organizationRoleBinding.revokedAt),
          ),
        )
        .returning();
      return rows.map((row) => decode(row));
    },
    mapToDatabaseError,
  );
  const revokeAllByRoleId = Effect.fn("OrganizationRoleBindingRepository.revokeAllByRoleId")(
    function* (organizationId: OrganizationId, roleId: OrganizationRoleId) {
      const rows = yield* database
        .update(organizationRoleBinding)
        .set({ revokedAt: DateTime.toDateUtc(yield* DateTime.now) })
        .where(
          and(
            eq(organizationRoleBinding.organizationId, organizationId),
            eq(organizationRoleBinding.roleId, roleId),
            isNull(organizationRoleBinding.revokedAt),
          ),
        )
        .returning();
      return rows.map((row) => decode(row));
    },
    mapToDatabaseError,
  );
  const listUsableOwners = Effect.fn("OrganizationRoleBindingRepository.listUsableOwners")(
    function* (organizationId: OrganizationId) {
      const usableEmail = database
        .select({ id: userEmail.id })
        .from(userEmail)
        .where(
          and(
            eq(userEmail.userId, user.id),
            isNull(userEmail.removedAt),
            isNotNull(userEmail.verifiedAt),
            eq(userEmail.loginEnabled, true),
          ),
        );
      const rows = yield* database
        .select({ member: organizationMember })
        .from(organizationMember)
        .innerJoin(user, eq(user.id, organizationMember.userId))
        .innerJoin(
          organizationRoleBinding,
          eq(organizationRoleBinding.memberId, organizationMember.id),
        )
        .innerJoin(organizationRole, eq(organizationRole.id, organizationRoleBinding.roleId))
        .where(
          and(
            eq(organizationMember.organizationId, organizationId),
            isNull(organizationMember.removedAt),
            isNull(organizationMember.suspendedAt),
            isNull(user.disabledAt),
            isNull(organizationRoleBinding.revokedAt),
            eq(organizationRole.kind, "builtin"),
            eq(organizationRole.key, "owner"),
            exists(usableEmail),
          ),
        );
      return rows.map((row) => Schema.decodeUnknownSync(OrganizationMember)(row.member));
    },
    mapToDatabaseError,
  );
  return {
    grant,
    findById,
    listActiveByMemberId,
    listActiveByMemberIds,
    revoke,
    revokeAllByMemberId,
    revokeAllByRoleId,
    listUsableOwners,
  } as const;
});
export class OrganizationRoleBindingRepository extends Context.Service<
  OrganizationRoleBindingRepository,
  Effect.Success<typeof makeOrganizationRoleBindingRepository>
>()("@usepreface/database/repositories/organization/OrganizationRoleBindingRepository") {
  static readonly layer = Layer.effect(
    OrganizationRoleBindingRepository,
    makeOrganizationRoleBindingRepository,
  );
}
