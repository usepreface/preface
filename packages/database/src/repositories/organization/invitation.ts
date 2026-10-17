import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type {
  OrganizationId,
  OrganizationInvitationId,
  OrganizationRoleId,
  UserId,
  EmailJobId,
} from "@usepreface/protocol";
import {
  CreateOrganizationInvitation,
  OrganizationInvitation,
  InvitationAssignment,
} from "@usepreface/protocol/model";
import { and, desc, eq, gt, isNull, lt } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { TransactionService } from "#/core/transaction";
import { organizationInvitation as invitation } from "#/schema/organization/invitation";
import { invitationAssignment } from "#/schema/organization/invitation-assignment";

const makeInvitationRepository = Effect.gen(function* () {
  const database = yield* Database;
  const transaction = yield* TransactionService;
  const decode = Schema.decodeUnknownSync(OrganizationInvitation);
  const pending = and(isNull(invitation.acceptedAt), isNull(invitation.revokedAt));
  const findById = Effect.fn("InvitationRepository.findById")(function* (
    organizationId: OrganizationId,
    id: OrganizationInvitationId,
  ) {
    const [row] = yield* database
      .select()
      .from(invitation)
      .where(and(eq(invitation.organizationId, organizationId), eq(invitation.id, id)));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  // Token entry points do not know the tenant until this row is loaded; all mutations remain tenant-scoped.
  const locate = Effect.fn("InvitationRepository.locate")(function* (id: OrganizationInvitationId) {
    const [row] = yield* database.select().from(invitation).where(eq(invitation.id, id));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const list = Effect.fn("InvitationRepository.list")(function* (
    organizationId: OrganizationId,
    input: { readonly cursor?: OrganizationInvitationId; readonly limit: number },
  ) {
    const rows = yield* database
      .select()
      .from(invitation)
      .where(
        and(
          eq(invitation.organizationId, organizationId),
          input.cursor === undefined ? undefined : lt(invitation.id, input.cursor),
        ),
      )
      .orderBy(desc(invitation.id))
      .limit(input.limit);
    return rows.map((row) => decode(row));
  }, mapToDatabaseError);
  const create = Effect.fn("InvitationRepository.create")(
    function* (input: CreateOrganizationInvitation, roleIds: readonly OrganizationRoleId[]) {
      const now = DateTime.toDateUtc(yield* DateTime.now);
      const [row] = yield* database
        .insert(invitation)
        .values({
          ...Schema.encodeSync(CreateOrganizationInvitation)(input),
          id: input.id,
          organizationId: input.organizationId,
          invitedByMemberId: input.invitedByMemberId,
          emailJobId: input.emailJobId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (row === undefined)
        return yield* Effect.die(new Error("Invitation insert returned no row"));
      yield* database.insert(invitationAssignment).values(
        roleIds.map((roleId) => ({
          organizationId: input.organizationId,
          invitationId: input.id,
          roleId,
          createdAt: now,
        })),
      );
      return decode(row);
    },
    transaction.run,
    mapToDatabaseError,
  );
  const assignments = Effect.fn("InvitationRepository.assignments")(function* (
    organizationId: OrganizationId,
    invitationId: OrganizationInvitationId,
  ) {
    const rows = yield* database
      .select()
      .from(invitationAssignment)
      .where(
        and(
          eq(invitationAssignment.organizationId, organizationId),
          eq(invitationAssignment.invitationId, invitationId),
        ),
      )
      .orderBy(invitationAssignment.roleId);
    return rows.map((row) => Schema.decodeUnknownSync(InvitationAssignment)(row));
  }, mapToDatabaseError);
  const revoke = Effect.fn("InvitationRepository.revoke")(function* (
    organizationId: OrganizationId,
    id: OrganizationInvitationId,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(invitation)
      .set({ revokedAt: now, updatedAt: now })
      .where(and(eq(invitation.organizationId, organizationId), eq(invitation.id, id), pending))
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findPendingByEmail = Effect.fn("InvitationRepository.findPendingByEmail")(function* (
    organizationId: OrganizationId,
    email: string,
  ) {
    const [row] = yield* database
      .select()
      .from(invitation)
      .where(
        and(eq(invitation.organizationId, organizationId), eq(invitation.email, email), pending),
      );
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const replaceCredential = Effect.fn("InvitationRepository.replaceCredential")(function* (
    organizationId: OrganizationId,
    id: OrganizationInvitationId,
    input: {
      readonly tokenHash: string;
      readonly emailJobId: EmailJobId;
      readonly expiresAt: DateTime.Utc;
    },
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(invitation)
      .set({
        tokenHash: input.tokenHash,
        emailJobId: input.emailJobId,
        expiresAt: DateTime.toDateUtc(input.expiresAt),
        updatedAt: now,
      })
      .where(and(eq(invitation.organizationId, organizationId), eq(invitation.id, id), pending))
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const accept = Effect.fn("InvitationRepository.accept")(function* (
    organizationId: OrganizationId,
    id: OrganizationInvitationId,
    userId: UserId,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(invitation)
      .set({ acceptedAt: now, acceptedByUserId: userId, updatedAt: now })
      .where(
        and(
          eq(invitation.organizationId, organizationId),
          eq(invitation.id, id),
          pending,
          gt(invitation.expiresAt, now),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  return {
    findById,
    locate,
    list,
    create,
    assignments,
    revoke,
    findPendingByEmail,
    replaceCredential,
    accept,
  } as const;
});
export class InvitationRepository extends Context.Service<
  InvitationRepository,
  Effect.Success<typeof makeInvitationRepository>
>()("@usepreface/database/repositories/organization/InvitationRepository") {
  static readonly layer = Layer.effect(InvitationRepository, makeInvitationRepository);
}
