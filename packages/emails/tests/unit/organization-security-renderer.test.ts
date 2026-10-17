import { expect, it } from "@effect/vitest";
import { DateTime, Effect } from "effect";

import { AuthenticationEmailRenderer, EmailRenderer } from "../../src/index.js";

it.effect("renders a recovery alert without treating an organization name as HTML", () =>
  Effect.gen(function* () {
    const rendered = yield* (yield* EmailRenderer).render({
      type: "organization-security",
      to: "owner@example.test",
      variables: {
        organizationName: "<script>company</script> & Team",
        action: "sso-recovered",
        occurredAt: yield* DateTime.now,
      },
    });
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).toContain("&lt;script&gt;company&lt;/script&gt; &amp; Team");
    expect(rendered.text).toContain("SSO is now optional");
    expect(rendered.text).toContain("credential has been consumed");
  }).pipe(Effect.provide(AuthenticationEmailRenderer.layer)),
);
