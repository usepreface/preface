import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type {
  IdentityConnectionId,
  OrganizationDomainId,
  OrganizationId,
} from "@usepreface/protocol";
import { OrganizationDomain } from "@usepreface/protocol/model";
import { and, eq, gt, isNull } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import {
  organizationDomain as table,
  identityConnectionDomain as binding,
} from "#/schema/organization/domain";

const makeRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(OrganizationDomain);
  const find = Effect.fn("DomainRepository.find")(function* (
    organizationId: OrganizationId,
    id: OrganizationDomainId,
  ) {
    const [row] = yield* database
      .select()
      .from(table)
      .where(and(eq(table.organizationId, organizationId), eq(table.id, id)));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const list = Effect.fn("DomainRepository.list")(function* (organizationId: OrganizationId) {
    const rows = yield* database
      .select()
      .from(table)
      .where(eq(table.organizationId, organizationId))
      .orderBy(table.domain);
    return rows.map((row) => decode(row));
  }, mapToDatabaseError);
  const create = Effect.fn("DomainRepository.create")(function* (input: OrganizationDomain) {
    const [row] = yield* database
      .insert(table)
      .values({
        ...Schema.encodeSync(OrganizationDomain)(input),
        id: input.id,
        organizationId: input.organizationId,
        approvedByUserId: input.approvedByUserId,
      })
      .returning();
    if (row === undefined) return yield* Effect.die(new Error("Domain insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const update = Effect.fn("DomainRepository.update")(function* (
    input: OrganizationDomain,
    expectedRevision: number,
  ) {
    const [row] = yield* database
      .update(table)
      .set({
        ...Schema.encodeSync(OrganizationDomain)(input),
        id: input.id,
        organizationId: input.organizationId,
        approvedByUserId: input.approvedByUserId,
      })
      .where(
        and(
          eq(table.id, input.id),
          eq(table.organizationId, input.organizationId),
          eq(table.revision, expectedRevision),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const replaceBindings = Effect.fn("DomainRepository.replaceBindings")(function* (
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
    revision: number,
    domains: readonly OrganizationDomain[],
  ) {
    yield* database
      .delete(binding)
      .where(
        and(
          eq(binding.organizationId, organizationId),
          eq(binding.identityConnectionId, connectionId),
        ),
      );
    const now = DateTime.toDateUtc(yield* DateTime.now);
    if (domains.length > 0)
      yield* database.insert(binding).values(
        domains.map((domain) => ({
          identityConnectionId: connectionId,
          domainId: domain.id,
          organizationId,
          connectionRevision: revision,
          domainRevision: domain.revision,
          createdAt: now,
        })),
      );
  }, mapToDatabaseError);
  const forConnection = Effect.fn("DomainRepository.forConnection")(function* (
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
    revision: number,
  ) {
    const rows = yield* database
      .select({ domain: table })
      .from(binding)
      .innerJoin(
        table,
        and(
          eq(table.id, binding.domainId),
          eq(table.organizationId, binding.organizationId),
          eq(table.revision, binding.domainRevision),
        ),
      )
      .where(
        and(
          eq(binding.organizationId, organizationId),
          eq(binding.identityConnectionId, connectionId),
          eq(binding.connectionRevision, revision),
          isNull(table.revokedAt),
          gt(table.verifiedUntil, DateTime.toDateUtc(yield* DateTime.now)),
        ),
      );
    return rows.map((row) => decode(row.domain));
  }, mapToDatabaseError);
  return { find, list, create, update, replaceBindings, forConnection };
});

export class OrganizationDomainRepository extends Context.Service<
  OrganizationDomainRepository,
  Effect.Success<typeof makeRepository>
>()("@usepreface/database/repositories/organization/DomainRepository") {
  static readonly layer = Layer.effect(OrganizationDomainRepository, makeRepository);
}
