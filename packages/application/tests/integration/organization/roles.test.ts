import { expect, layer } from "@effect/vitest";
import { Effect } from "effect";

import { Database, DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import {
  createTestIdentity,
  createTestOrganization,
  admitTestMember,
} from "../../fixtures/organization.js";

layer(ApplicationTestLayer)("organization roles and delegation", (it) => {
  it.effect("rechecks edited/revoked permissions and retires custom roles atomically", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const fixture = yield* createTestOrganization;
      const editor = yield* createTestIdentity("editor@example.test", "Editor");
      const member = yield* admitTestMember(fixture.organization.id, editor.actor.user.id);
      const role = yield* application.organization.role.create(
        fixture.owner.actor,
        fixture.organization.id,
        {
          key: "editor",
          name: "Editor",
          permissions: ["organization.read", "organization.update"],
        },
      );
      const binding = yield* application.organization.roleBinding.grant(
        fixture.owner.actor,
        fixture.organization.id,
        { memberId: member.id, roleId: role.id },
      );
      expect(
        (yield* application.organization.roleBinding.grant(
          fixture.owner.actor,
          fixture.organization.id,
          { memberId: member.id, roleId: role.id },
        )).id,
      ).toBe(binding.id);
      yield* application.organization.organization.update(editor.actor, fixture.organization.id, {
        name: "Edited",
      });
      yield* application.organization.role.update(
        fixture.owner.actor,
        fixture.organization.id,
        role.id,
        { permissions: ["organization.read"] },
      );
      expect(
        yield* application.organization.organization
          .update(editor.actor, fixture.organization.id, { name: "Forbidden" })
          .pipe(Effect.flip),
      ).toMatchObject({ _tag: "OrganizationError", code: "FORBIDDEN" });
      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* rejectLifecycleAudit;
          expect(
            yield* application.organization.role
              .archive(fixture.owner.actor, fixture.organization.id, role.id)
              .pipe(Effect.flip),
          ).toMatchObject({ _tag: "DatabaseError" });
        }),
      );
      expect(
        (yield* repository.organization.role.findById(fixture.organization.id, role.id))
          ?.archivedAt,
      ).toBeNull();
      expect(
        (yield* repository.organization.roleBinding.findById(fixture.organization.id, binding.id))
          ?.revokedAt,
      ).toBeNull();
      yield* application.organization.role.archive(
        fixture.owner.actor,
        fixture.organization.id,
        role.id,
      );
      expect(
        (yield* repository.organization.roleBinding.findById(fixture.organization.id, binding.id))
          ?.revokedAt,
      ).not.toBeNull();
      expect(
        (yield* application.organization.organization.getAccess(
          editor.actor,
          fixture.organization.id,
        )).permissions,
      ).toEqual([]);
      const history = yield* application.organization.role.list(
        fixture.owner.actor,
        fixture.organization.id,
        { includeArchived: true },
      );
      expect(
        history.roles.find((candidate) => candidate.id === role.id)?.archivedAt,
      ).not.toBeNull();
      const grants = yield* (yield* Database).query.auditEvent.findMany({
        where: { eventType: { eq: "organization.role_granted" }, targetId: { eq: binding.id } },
      });
      expect(grants).toHaveLength(1);
    }),
  );

  it.effect(
    "prevents role administrators from delegating authority beyond their own permissions or editing built-ins",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createTestOrganization;
        const administrator = yield* createTestIdentity("roles@example.test", "Role Administrator");
        const member = yield* admitTestMember(fixture.organization.id, administrator.actor.user.id);
        const delegated = yield* application.organization.role.create(
          fixture.owner.actor,
          fixture.organization.id,
          {
            key: "role-administrator",
            name: "Role Administrator",
            permissions: ["organization.read", "roles.manage", "roles.assign"],
          },
        );
        yield* application.organization.roleBinding.grant(
          fixture.owner.actor,
          fixture.organization.id,
          { memberId: member.id, roleId: delegated.id },
        );
        expect(
          yield* application.organization.role
            .create(administrator.actor, fixture.organization.id, {
              key: "too-powerful",
              name: "Too Powerful",
              permissions: ["members.manage"],
            })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "ROLE_NOT_ASSIGNABLE" });
        const adminRole = yield* repository.organization.role.findByKey(
          fixture.organization.id,
          "admin",
        );
        if (adminRole === undefined) throw new Error("Expected administrator role");
        expect(
          yield* application.organization.roleBinding
            .grant(administrator.actor, fixture.organization.id, {
              memberId: member.id,
              roleId: adminRole.id,
            })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "ROLE_NOT_ASSIGNABLE" });
        expect(
          yield* application.organization.role
            .update(fixture.owner.actor, fixture.organization.id, adminRole.id, { name: "Changed" })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "BUILTIN_ROLE_PROTECTED" });
        expect(
          yield* application.organization.role
            .create(fixture.owner.actor, fixture.organization.id, {
              key: "fake-owner",
              name: "Fake Owner",
              permissions: ["organization.archive"],
            })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "ROLE_NOT_ASSIGNABLE" });
      }),
  );

  it.effect(
    "rejects cross-organization assignments at both the workflow and persistence boundaries",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createTestOrganization;
        const other = yield* application.organization.organization.create(fixture.owner.actor, {
          name: "Other",
          slug: "other",
        });
        const foreignRole = yield* repository.organization.role.findByKey(
          other.organization.id,
          "admin",
        );
        if (foreignRole === undefined) throw new Error("Expected foreign role");
        expect(
          yield* application.organization.roleBinding
            .grant(fixture.owner.actor, fixture.organization.id, {
              memberId: fixture.membership.id,
              roleId: foreignRole.id,
            })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "ROLE_NOT_FOUND" });
        expect(
          yield* repository.organization.roleBinding
            .grant({
              organizationId: fixture.organization.id,
              memberId: fixture.membership.id,
              grantedByMemberId: fixture.membership.id,
              roleId: foreignRole.id,
            })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "DatabaseError", reason: { _tag: "ConstraintError" } });
        expect(
          (yield* application.organization.organization.getAccess(
            fixture.owner.actor,
            fixture.organization.id,
          )).isOwner,
        ).toBe(true);
      }),
  );
});
