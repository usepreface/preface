import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { OrganizationId, OrganizationRoleId } from "@usepreface/protocol";
import {
  CreateOrganizationRole,
  OrganizationRole,
  UpdateOrganizationRole,
} from "@usepreface/protocol/model";
import { and, desc, eq, isNull, lt } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { organizationRole } from "#/schema/organization/role";

const makeOrganizationRoleRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(OrganizationRole);
  const findById = Effect.fn("OrganizationRoleRepository.findById")(function* (
    organizationId: OrganizationId,
    id: OrganizationRoleId,
  ) {
    const [row] = yield* database
      .select()
      .from(organizationRole)
      .where(and(eq(organizationRole.organizationId, organizationId), eq(organizationRole.id, id)));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findByKey = Effect.fn("OrganizationRoleRepository.findByKey")(function* (
    organizationId: OrganizationId,
    key: string,
  ) {
    const [row] = yield* database
      .select()
      .from(organizationRole)
      .where(
        and(eq(organizationRole.organizationId, organizationId), eq(organizationRole.key, key)),
      );
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const create = Effect.fn("OrganizationRoleRepository.create")(function* (
    input: CreateOrganizationRole,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .insert(organizationRole)
      .values({
        ...Schema.encodeSync(CreateOrganizationRole)(input),
        organizationId: input.organizationId,
        permissions: input.permissions,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (row === undefined) return yield* Effect.die(new Error("Role insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const listByOrganizationId = Effect.fn("OrganizationRoleRepository.listByOrganizationId")(
    function* (
      organizationId: OrganizationId,
      input: {
        readonly cursor?: OrganizationRoleId;
        readonly limit: number;
        readonly includeArchived?: boolean;
      },
    ) {
      const rows = yield* database
        .select()
        .from(organizationRole)
        .where(
          and(
            eq(organizationRole.organizationId, organizationId),
            input.includeArchived === true ? undefined : isNull(organizationRole.archivedAt),
            input.cursor === undefined ? undefined : lt(organizationRole.id, input.cursor),
          ),
        )
        .orderBy(desc(organizationRole.id))
        .limit(input.limit);
      return rows.map((row) => decode(row));
    },
    mapToDatabaseError,
  );
  const update = Effect.fn("OrganizationRoleRepository.update")(function* (
    organizationId: OrganizationId,
    id: OrganizationRoleId,
    input: UpdateOrganizationRole,
  ) {
    const [row] = yield* database
      .update(organizationRole)
      .set({
        ...Schema.encodeSync(UpdateOrganizationRole)(input),
        updatedAt: DateTime.toDateUtc(yield* DateTime.now),
      })
      .where(
        and(
          eq(organizationRole.organizationId, organizationId),
          eq(organizationRole.id, id),
          eq(organizationRole.kind, "custom"),
          isNull(organizationRole.archivedAt),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const archive = Effect.fn("OrganizationRoleRepository.archive")(function* (
    organizationId: OrganizationId,
    id: OrganizationRoleId,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(organizationRole)
      .set({ archivedAt: now, updatedAt: now })
      .where(
        and(
          eq(organizationRole.organizationId, organizationId),
          eq(organizationRole.id, id),
          eq(organizationRole.kind, "custom"),
          isNull(organizationRole.archivedAt),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  return { create, findById, findByKey, listByOrganizationId, update, archive } as const;
});
export class OrganizationRoleRepository extends Context.Service<
  OrganizationRoleRepository,
  Effect.Success<typeof makeOrganizationRoleRepository>
>()("@usepreface/database/repositories/organization/OrganizationRoleRepository") {
  static readonly layer = Layer.effect(OrganizationRoleRepository, makeOrganizationRoleRepository);
}
