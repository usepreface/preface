import type { PublicTeam } from "@usepreface/protocol/dto";
import type { Team } from "@usepreface/protocol/model";
export const publicTeam = (team: Team): PublicTeam => ({
  id: team.id,
  slug: team.slug,
  metadata: team.metadata,
  archivedAt: team.archivedAt,
  createdAt: team.createdAt,
  updatedAt: team.updatedAt,
});
