import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";

import type { OrganizationId, UserId } from "@usepreface/protocol";
import { CreateOrganization, Organization, UpdateOrganization } from "@usepreface/protocol/model";
import { and, desc, eq, exists, isNotNull, isNull, lt, or } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { organizationMember } from "#/schema/organization/member";
import { organization } from "#/schema/organization/organization";
import { organizationRole } from "#/schema/organization/role";
import { organizationRoleBinding } from "#/schema/organization/role-binding";

const makeOrganizationRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(Organization);
  const findById = Effect.fn("OrganizationRepository.findById")(function* (id: OrganizationId) {
    const [row] = yield* database.select().from(organization).where(eq(organization.id, id));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findBySlug = Effect.fn("OrganizationRepository.findBySlug")(function* (slug: string) {
    const [row] = yield* database.select().from(organization).where(eq(organization.slug, slug));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const lockById = Effect.fn("OrganizationRepository.lockById")(function* (id: OrganizationId) {
    if (Option.isNone(yield* Effect.serviceOption(database.$client.transactionService)))
      return yield* Effect.die(new Error("Organization locking requires TransactionService.run"));
    const [row] = yield* database
      .select()
      .from(organization)
      .where(eq(organization.id, id))
      .for("update");
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const create = Effect.fn("OrganizationRepository.create")(function* (input: CreateOrganization) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .insert(organization)
      .values({
        ...Schema.encodeSync(CreateOrganization)(input),
        createdByUserId: input.createdByUserId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (row === undefined)
      return yield* Effect.die(new Error("Organization insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const listAccessibleByUserId = Effect.fn("OrganizationRepository.listAccessibleByUserId")(
    function* (
      userId: UserId,
      input: {
        readonly cursor?: OrganizationId;
        readonly limit: number;
        readonly includeArchived?: boolean;
      },
    ) {
      const owner = database
        .select({ id: organizationRoleBinding.id })
        .from(organizationRoleBinding)
        .innerJoin(organizationRole, eq(organizationRole.id, organizationRoleBinding.roleId))
        .where(
          and(
            eq(organizationRoleBinding.memberId, organizationMember.id),
            isNull(organizationRoleBinding.revokedAt),
            eq(organizationRole.kind, "builtin"),
            eq(organizationRole.key, "owner"),
          ),
        );
      const rows = yield* database
        .select({ organization })
        .from(organization)
        .innerJoin(organizationMember, eq(organizationMember.organizationId, organization.id))
        .where(
          and(
            eq(organizationMember.userId, userId),
            isNull(organizationMember.removedAt),
            isNull(organizationMember.suspendedAt),
            input.includeArchived === true
              ? or(isNull(organization.archivedAt), exists(owner))
              : isNull(organization.archivedAt),
            input.cursor === undefined ? undefined : lt(organization.id, input.cursor),
          ),
        )
        .orderBy(desc(organization.id))
        .limit(input.limit);
      return rows.map((row) => decode(row.organization));
    },
    mapToDatabaseError,
  );
  const update = Effect.fn("OrganizationRepository.update")(function* (
    id: OrganizationId,
    input: UpdateOrganization,
  ) {
    const [row] = yield* database
      .update(organization)
      .set({
        ...Schema.encodeSync(UpdateOrganization)(input),
        updatedAt: DateTime.toDateUtc(yield* DateTime.now),
      })
      .where(and(eq(organization.id, id), isNull(organization.archivedAt)))
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const archive = Effect.fn("OrganizationRepository.archive")(function* (id: OrganizationId) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(organization)
      .set({ archivedAt: now, updatedAt: now })
      .where(and(eq(organization.id, id), isNull(organization.archivedAt)))
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const restore = Effect.fn("OrganizationRepository.restore")(function* (id: OrganizationId) {
    const [row] = yield* database
      .update(organization)
      .set({ archivedAt: null, updatedAt: DateTime.toDateUtc(yield* DateTime.now) })
      .where(and(eq(organization.id, id), isNotNull(organization.archivedAt)))
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  return {
    create,
    findById,
    findBySlug,
    lockById,
    listAccessibleByUserId,
    update,
    archive,
    restore,
  } as const;
});
export class OrganizationRepository extends Context.Service<
  OrganizationRepository,
  Effect.Success<typeof makeOrganizationRepository>
>()("@usepreface/database/repositories/organization/OrganizationRepository") {
  static readonly layer = Layer.effect(OrganizationRepository, makeOrganizationRepository);
}
