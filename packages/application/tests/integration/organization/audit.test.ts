import { expect, layer } from "@effect/vitest";
import { Effect } from "effect";

import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import {
  admitTestMember,
  createTestIdentity,
  createTestOrganization,
} from "../../fixtures/organization.js";

layer(ApplicationTestLayer)("Audit history authority", (it) => {
  it.effect("paginates one organization's history and keeps instance history separate", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const { owner, organization } = yield* createTestOrganization;
      const other = yield* application.organization.organization.create(owner.actor, {
        metadata: { name: "Other" },
        slug: "other",
      });
      yield* application.organization.organization.update(owner.actor, organization.id, {
        metadata: { name: "Knowledge updated" },
      });
      yield* application.organization.organization.update(owner.actor, other.organization.id, {
        metadata: { name: "Private other organization" },
      });
      const first = yield* application.audit.list(owner.actor, organization.id, { limit: 1 });
      expect(first.events).toHaveLength(1);
      expect(first.events[0]?.eventType).toBe("organization.updated");
      if (first.nextCursor === null) throw new Error("Expected continuation cursor");
      const second = yield* application.audit.list(owner.actor, organization.id, {
        limit: 1,
        cursor: first.nextCursor,
      });
      expect(second.events[0]?.eventType).toBe("organization.created");
      expect(second.events[0]?.id).not.toBe(first.events[0]?.id);
      expect(
        [...first.events, ...second.events].every(
          (event) => event.organizationId === organization.id,
        ),
      ).toBe(true);
      const instance = yield* application.audit.list(owner.actor, null);
      expect(
        instance.events.some((event) => event.eventType === "instance.bootstrap_completed"),
      ).toBe(true);
      expect(
        instance.events.some(
          (event) =>
            event.eventType === "organization.created" ||
            event.eventType === "auth.session_created",
        ),
      ).toBe(false);
      const exported = yield* application.audit.exportCsv(owner.actor, organization.id);
      expect(exported.content).toContain("Knowledge updated");
      expect(exported.content).not.toContain("Private other organization");
      const outsider = yield* createTestIdentity("outsider@example.test", "Outsider");
      expect(
        yield* application.audit.list(outsider.actor, organization.id).pipe(Effect.flip),
      ).toMatchObject({ code: "ORGANIZATION_NOT_FOUND" });
      yield* admitTestMember(organization.id, outsider.actor.user.id);
      expect(
        yield* application.audit.list(outsider.actor, organization.id).pipe(Effect.flip),
      ).toMatchObject({ code: "FORBIDDEN" });
      expect(yield* application.audit.list(outsider.actor, null).pipe(Effect.flip)).toMatchObject({
        code: "FORBIDDEN",
      });
    }),
  );
});
