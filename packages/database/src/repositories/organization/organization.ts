import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";

import type { OrganizationId } from "@usepreface/protocol";
import { CreateOrganization, Organization, UpdateOrganization } from "@usepreface/protocol/model";
import { eq } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { organization } from "#/schema/organization/organization";

const makeOrganizationRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(Organization);
  const find = Effect.fn("OrganizationRepository.find")(function* () {
    const [row] = yield* database
      .select()
      .from(organization)
      .where(eq(organization.installationId, 1));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findById = Effect.fn("OrganizationRepository.findById")(function* (id: OrganizationId) {
    const [row] = yield* database.select().from(organization).where(eq(organization.id, id));
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
      .where(eq(organization.id, id))
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  return { find, findById, lockById, create, update };
});
export class OrganizationRepository extends Context.Service<
  OrganizationRepository,
  Effect.Success<typeof makeOrganizationRepository>
>()("@usepreface/database/repositories/organization/OrganizationRepository") {
  static readonly layer = Layer.effect(OrganizationRepository, makeOrganizationRepository);
}
