import { expect, it } from "@effect/vitest";
import { DateTime, Effect } from "effect";

import { AuthenticationEmailRenderer, EmailRenderer } from "../../src/index.js";

it.effect("renders invitation text safely when names contain HTML", () =>
  Effect.gen(function* () {
    const expiresAt = DateTime.addDuration(yield* DateTime.now, "7 days");
    const rendered = yield* (yield* EmailRenderer).render({
      type: "organization-invitation",
      to: "recipient@example.test",
      variables: {
        instanceName: "Preface",
        organizationName: '<script>alert("x")</script>',
        inviterName: "Owner & Team",
        roleName: "Reader < Member",
        invitationUrl:
          "https://preface.example.test/invitations/accept#token=example&invitationId=example",
        expiresAt,
      },
    });
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(rendered.html).toContain("Owner &amp; Team");
    expect(rendered.html).toContain("token=example&amp;invitationId=example");
    expect(rendered.text).toContain("Owner & Team");
  }).pipe(Effect.provide(AuthenticationEmailRenderer.layer)),
);
