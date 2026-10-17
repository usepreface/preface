import { DateTime, Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import type { OrganizationId, UserId } from "@usepreface/protocol";

import { Application } from "../../src/index.js";
import { completeTestBootstrap } from "./bootstrap.js";
import { signInTestUser } from "./email-sign-in.js";

export const createTestIdentity = Effect.fnUntraced(function* (email: string, displayName: string) {
  const repository = yield* DatabaseRepository;
  const user = yield* repository.auth.user.create({ metadata: { version: 1, name: displayName } });
  yield* repository.auth.userEmail.create({
    userId: user.id,
    email,
    isPrimary: true,
    loginEnabled: true,
    verifiedAt: yield* DateTime.now,
  });
  return yield* signInTestUser(email);
});

// Authority tests seed membership directly; invitation tests exercise verified admission.
export const admitTestMember = Effect.fnUntraced(function* (
  organizationId: OrganizationId,
  userId: UserId,
) {
  return yield* (yield* DatabaseRepository).organization.member.create({ organizationId, userId });
});

export const createTestOrganization = Effect.gen(function* () {
  const owner = yield* completeTestBootstrap;
  const created = yield* (yield* Application).organization.organization.create(owner.actor, {
    metadata: { name: "Knowledge" },
    slug: "knowledge",
  });
  return { owner, ...created };
});
