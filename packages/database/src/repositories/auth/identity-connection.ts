import { Context, Effect, Layer, Option, Schema } from "effect";

import type { IdentityConnectionId, OrganizationId } from "@usepreface/protocol";
import {
  IdentityConnection,
  GoogleConnection,
  OidcConnection,
  SamlConnection,
  OrganizationIdentityConnection,
} from "@usepreface/protocol/model";
import { and, eq } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { identityConnection as table } from "#/schema/auth/identity-connection";
const makeRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(IdentityConnection);
  const findGoogle = Effect.fn("IdentityConnectionRepository.findGoogle")(function* () {
    const [row] = yield* database.select().from(table).where(eq(table.provider, "google"));
    return row === undefined ? undefined : Schema.decodeUnknownSync(GoogleConnection)(row);
  }, mapToDatabaseError);
  const findById = Effect.fn("IdentityConnectionRepository.findById")(function* (
    id: IdentityConnectionId,
  ) {
    const [row] = yield* database.select().from(table).where(eq(table.id, id));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const lockById = Effect.fn("IdentityConnectionRepository.lockById")(function* (
    id: IdentityConnectionId,
  ) {
    if (Option.isNone(yield* Effect.serviceOption(database.$client.transactionService)))
      return yield* Effect.die(new Error("Connection locking requires TransactionService.run"));
    const [row] = yield* database.select().from(table).where(eq(table.id, id)).for("update");
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const createGoogle = Effect.fn("IdentityConnectionRepository.createGoogle")(function* (
    input: GoogleConnection,
  ) {
    const [row] = yield* database
      .insert(table)
      .values({
        ...Schema.encodeSync(IdentityConnection)(input),
        id: input.id,
        organizationId: input.organizationId,
      })
      .returning();
    if (row === undefined) return yield* Effect.die(new Error("Connection insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const update = Effect.fn("IdentityConnectionRepository.update")(function* (
    input: IdentityConnection,
    expectedRevision: number,
  ) {
    const [row] = yield* database
      .update(table)
      .set({
        ...Schema.encodeSync(IdentityConnection)(input),
        id: input.id,
        organizationId: input.organizationId,
      })
      .where(and(eq(table.id, input.id), eq(table.revision, expectedRevision)))
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findByOrganizationAndId = Effect.fn("IdentityConnectionRepository.findByOrganizationAndId")(
    function* (organizationId: OrganizationId, id: IdentityConnectionId) {
      const [row] = yield* database
        .select()
        .from(table)
        .where(and(eq(table.id, id), eq(table.organizationId, organizationId)));
      return row === undefined
        ? undefined
        : Schema.decodeUnknownSync(OrganizationIdentityConnection)(row);
    },
    mapToDatabaseError,
  );
  const listByOrganization = Effect.fn("IdentityConnectionRepository.listByOrganization")(
    function* (organizationId: OrganizationId) {
      const rows = yield* database
        .select()
        .from(table)
        .where(eq(table.organizationId, organizationId))
        .orderBy(table.id);
      return rows.map((row) => Schema.decodeUnknownSync(OrganizationIdentityConnection)(row));
    },
    mapToDatabaseError,
  );
  const createOidc = Effect.fn("IdentityConnectionRepository.createOidc")(function* (
    input: OidcConnection,
  ) {
    const [row] = yield* database
      .insert(table)
      .values({
        ...Schema.encodeSync(OidcConnection)(input),
        id: input.id,
        organizationId: input.organizationId,
      })
      .returning();
    if (row === undefined)
      return yield* Effect.die(new Error("OIDC connection insert returned no row"));
    return Schema.decodeUnknownSync(OidcConnection)(row);
  }, mapToDatabaseError);
  const createSaml = Effect.fn("IdentityConnectionRepository.createSaml")(function* (
    input: SamlConnection,
  ) {
    const [row] = yield* database
      .insert(table)
      .values({
        ...Schema.encodeSync(SamlConnection)(input),
        id: input.id,
        organizationId: input.organizationId,
      })
      .returning();
    if (row === undefined)
      return yield* Effect.die(new Error("SAML connection insert returned no row"));
    return Schema.decodeUnknownSync(SamlConnection)(row);
  }, mapToDatabaseError);
  return {
    createSaml,
    findGoogle,
    findById,
    lockById,
    createGoogle,
    createOidc,
    update,
    findByOrganizationAndId,
    listByOrganization,
  };
});
export class IdentityConnectionRepository extends Context.Service<
  IdentityConnectionRepository,
  Effect.Success<typeof makeRepository>
>()("@usepreface/database/IdentityConnectionRepository") {
  static readonly layer = Layer.effect(IdentityConnectionRepository, makeRepository);
}
