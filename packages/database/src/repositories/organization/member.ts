import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { OrganizationId, OrganizationMemberId, UserId } from "@usepreface/protocol";
import { CreateOrganizationMember, OrganizationMember } from "@usepreface/protocol/model";
import { and, desc, eq, isNotNull, isNull, lt } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { user } from "#/schema/auth/user";
import { organizationMember } from "#/schema/organization/member";

const makeOrganizationMemberRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(OrganizationMember);
  const findById = Effect.fn("OrganizationMemberRepository.findById")(function* (
    organizationId: OrganizationId,
    id: OrganizationMemberId,
  ) {
    const [row] = yield* database
      .select()
      .from(organizationMember)
      .where(
        and(eq(organizationMember.organizationId, organizationId), eq(organizationMember.id, id)),
      );
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findByUserId = Effect.fn("OrganizationMemberRepository.findByUserId")(function* (
    organizationId: OrganizationId,
    userId: UserId,
  ) {
    const [row] = yield* database
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.organizationId, organizationId),
          eq(organizationMember.userId, userId),
        ),
      );
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const create = Effect.fn("OrganizationMemberRepository.create")(function* (
    input: CreateOrganizationMember,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .insert(organizationMember)
      .values({
        ...Schema.encodeSync(CreateOrganizationMember)(input),
        organizationId: input.organizationId,
        userId: input.userId,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (row === undefined) return yield* Effect.die(new Error("Member insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const listByOrganizationId = Effect.fn("OrganizationMemberRepository.listByOrganizationId")(
    function* (
      organizationId: OrganizationId,
      input: {
        readonly cursor?: OrganizationMemberId;
        readonly limit: number;
        readonly includeRemoved?: boolean;
      },
    ) {
      const rows = yield* database
        .select({ member: organizationMember, displayName: user.displayName })
        .from(organizationMember)
        .innerJoin(user, eq(user.id, organizationMember.userId))
        .where(
          and(
            eq(organizationMember.organizationId, organizationId),
            input.includeRemoved === true ? undefined : isNull(organizationMember.removedAt),
            input.cursor === undefined ? undefined : lt(organizationMember.id, input.cursor),
          ),
        )
        .orderBy(desc(organizationMember.id))
        .limit(input.limit);
      return rows.map((row) => ({ member: decode(row.member), displayName: row.displayName }));
    },
    mapToDatabaseError,
  );
  const suspend = Effect.fn("OrganizationMemberRepository.suspend")(function* (
    organizationId: OrganizationId,
    id: OrganizationMemberId,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(organizationMember)
      .set({ suspendedAt: now, updatedAt: now })
      .where(
        and(
          eq(organizationMember.organizationId, organizationId),
          eq(organizationMember.id, id),
          isNull(organizationMember.removedAt),
          isNull(organizationMember.suspendedAt),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const reinstate = Effect.fn("OrganizationMemberRepository.reinstate")(function* (
    organizationId: OrganizationId,
    id: OrganizationMemberId,
  ) {
    const [row] = yield* database
      .update(organizationMember)
      .set({ suspendedAt: null, updatedAt: DateTime.toDateUtc(yield* DateTime.now) })
      .where(
        and(
          eq(organizationMember.organizationId, organizationId),
          eq(organizationMember.id, id),
          isNull(organizationMember.removedAt),
          isNotNull(organizationMember.suspendedAt),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const remove = Effect.fn("OrganizationMemberRepository.remove")(function* (
    organizationId: OrganizationId,
    id: OrganizationMemberId,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(organizationMember)
      .set({ removedAt: now, suspendedAt: null, updatedAt: now })
      .where(
        and(
          eq(organizationMember.organizationId, organizationId),
          eq(organizationMember.id, id),
          isNull(organizationMember.removedAt),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const readmit = Effect.fn("OrganizationMemberRepository.readmit")(function* (
    organizationId: OrganizationId,
    id: OrganizationMemberId,
  ) {
    const [row] = yield* database
      .update(organizationMember)
      .set({ removedAt: null, updatedAt: DateTime.toDateUtc(yield* DateTime.now) })
      .where(
        and(
          eq(organizationMember.organizationId, organizationId),
          eq(organizationMember.id, id),
          isNotNull(organizationMember.removedAt),
          isNull(organizationMember.suspendedAt),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  return {
    readmit,
    create,
    findById,
    findByUserId,
    listByOrganizationId,
    suspend,
    reinstate,
    remove,
  } as const;
});
export class OrganizationMemberRepository extends Context.Service<
  OrganizationMemberRepository,
  Effect.Success<typeof makeOrganizationMemberRepository>
>()("@usepreface/database/repositories/organization/OrganizationMemberRepository") {
  static readonly layer = Layer.effect(
    OrganizationMemberRepository,
    makeOrganizationMemberRepository,
  );
}
