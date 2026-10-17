import { Context, DateTime, Effect, Layer, Schema } from "effect";

import { TeamMetadata as TeamMetadataSchema } from "@usepreface/protocol";
import type {
  OrganizationId,
  OrganizationMemberId,
  TeamId,
  TeamMetadata,
  TeamMemberId,
} from "@usepreface/protocol";
import { CreateTeam, Team, TeamMember, User } from "@usepreface/protocol/model";
import { and, desc, eq, isNull, lt } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { user } from "#/schema/auth/user";
import { organizationMember } from "#/schema/organization/member";
import { team } from "#/schema/organization/team";
import { teamMember } from "#/schema/organization/team-member";

const makeTeamRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(Team);
  const decodeMember = Schema.decodeUnknownSync(TeamMember);
  const findById = Effect.fn("TeamRepository.findById")(function* (
    organizationId: OrganizationId,
    teamId: TeamId,
  ) {
    const [row] = yield* database
      .select()
      .from(team)
      .where(and(eq(team.organizationId, organizationId), eq(team.id, teamId)));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const create = Effect.fn("TeamRepository.create")(function* (input: CreateTeam) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .insert(team)
      .values({
        ...Schema.encodeSync(CreateTeam)(input),
        organizationId: input.organizationId,
        createdByMemberId: input.createdByMemberId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (row === undefined) return yield* Effect.die(new Error("Team insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const list = Effect.fn("TeamRepository.list")(function* (
    organizationId: OrganizationId,
    input: { readonly cursor?: TeamId; readonly limit: number; readonly includeArchived?: boolean },
  ) {
    const rows = yield* database
      .select()
      .from(team)
      .where(
        and(
          eq(team.organizationId, organizationId),
          input.includeArchived === true ? undefined : isNull(team.archivedAt),
          input.cursor === undefined ? undefined : lt(team.id, input.cursor),
        ),
      )
      .orderBy(desc(team.id))
      .limit(input.limit);
    return rows.map((row) => decode(row));
  }, mapToDatabaseError);
  const update = Effect.fn("TeamRepository.update")(function* (
    organizationId: OrganizationId,
    teamId: TeamId,
    input: { readonly metadata: TeamMetadata; readonly slug: string },
  ) {
    const [row] = yield* database
      .update(team)
      .set({
        ...input,
        metadata: Schema.encodeSync(TeamMetadataSchema)(input.metadata),
        updatedAt: DateTime.toDateUtc(yield* DateTime.now),
      })
      .where(
        and(eq(team.organizationId, organizationId), eq(team.id, teamId), isNull(team.archivedAt)),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const archive = Effect.fn("TeamRepository.archive")(function* (
    organizationId: OrganizationId,
    teamId: TeamId,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(team)
      .set({ archivedAt: now, updatedAt: now })
      .where(
        and(eq(team.organizationId, organizationId), eq(team.id, teamId), isNull(team.archivedAt)),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findMember = Effect.fn("TeamRepository.member.find")(function* (
    organizationId: OrganizationId,
    teamId: TeamId,
    memberId: OrganizationMemberId,
  ) {
    const [row] = yield* database
      .select()
      .from(teamMember)
      .where(
        and(
          eq(teamMember.organizationId, organizationId),
          eq(teamMember.teamId, teamId),
          eq(teamMember.memberId, memberId),
        ),
      );
    return row === undefined ? undefined : decodeMember(row);
  }, mapToDatabaseError);
  const addMember = Effect.fn("TeamRepository.member.add")(function* (
    organizationId: OrganizationId,
    teamId: TeamId,
    memberId: OrganizationMemberId,
    addedByMemberId: OrganizationMemberId,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .insert(teamMember)
      .values({
        organizationId,
        teamId,
        memberId,
        addedByMemberId,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [teamMember.organizationId, teamMember.teamId, teamMember.memberId],
        set: { removedAt: null, addedByMemberId, updatedAt: now },
      })
      .returning();
    if (row === undefined)
      return yield* Effect.die(new Error("Team member insert returned no row"));
    return decodeMember(row);
  }, mapToDatabaseError);
  const listMembers = Effect.fn("TeamRepository.member.list")(function* (
    organizationId: OrganizationId,
    teamId: TeamId,
    input: { readonly cursor?: TeamMemberId; readonly limit: number },
  ) {
    const rows = yield* database
      .select({ membership: teamMember, user })
      .from(teamMember)
      .innerJoin(organizationMember, eq(organizationMember.id, teamMember.memberId))
      .innerJoin(user, eq(user.id, organizationMember.userId))
      .where(
        and(
          eq(teamMember.organizationId, organizationId),
          eq(teamMember.teamId, teamId),
          isNull(teamMember.removedAt),
          isNull(organizationMember.removedAt),
          isNull(organizationMember.suspendedAt),
          isNull(user.disabledAt),
          input.cursor === undefined ? undefined : lt(teamMember.id, input.cursor),
        ),
      )
      .orderBy(desc(teamMember.id))
      .limit(input.limit);
    return rows.map((row) => ({
      membership: decodeMember(row.membership),
      user: Schema.decodeUnknownSync(User)(row.user),
    }));
  }, mapToDatabaseError);
  const removeMember = Effect.fn("TeamRepository.member.remove")(function* (
    organizationId: OrganizationId,
    teamId: TeamId,
    memberId: OrganizationMemberId,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(teamMember)
      .set({ removedAt: now, updatedAt: now })
      .where(
        and(
          eq(teamMember.organizationId, organizationId),
          eq(teamMember.teamId, teamId),
          eq(teamMember.memberId, memberId),
          isNull(teamMember.removedAt),
        ),
      )
      .returning();
    return row === undefined ? undefined : decodeMember(row);
  }, mapToDatabaseError);
  const removeAllByMember = Effect.fn("TeamRepository.member.removeAllByMember")(function* (
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    yield* database
      .update(teamMember)
      .set({ removedAt: now, updatedAt: now })
      .where(
        and(
          eq(teamMember.organizationId, organizationId),
          eq(teamMember.memberId, memberId),
          isNull(teamMember.removedAt),
        ),
      );
  }, mapToDatabaseError);
  return {
    findById,
    create,
    list,
    update,
    archive,
    member: {
      find: findMember,
      add: addMember,
      list: listMembers,
      remove: removeMember,
      removeAllByMember,
    },
  };
});
export class TeamRepository extends Context.Service<
  TeamRepository,
  Effect.Success<typeof makeTeamRepository>
>()("@usepreface/database/repositories/organization/TeamRepository") {
  static readonly layer = Layer.effect(TeamRepository, makeTeamRepository);
}
