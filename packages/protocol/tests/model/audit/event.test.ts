import { Schema } from "effect";

import { describe, expect, it } from "vitest";

import { RecordAuditEvent } from "../../../src/model/index.js";
import { sessionCreatedEvent } from "../../fixtures/audit.js";

describe("audit event contracts", () => {
  it("rejects a system event attributed to a user", () => {
    const event = { ...sessionCreatedEvent, actorKind: "system" };

    expect(() => Schema.decodeUnknownSync(RecordAuditEvent)(event)).toThrow();
  });

  it("rejects a session event targeting a different resource type", () => {
    const event = { ...sessionCreatedEvent, targetType: "installation" };

    expect(() => Schema.decodeUnknownSync(RecordAuditEvent)(event)).toThrow();
  });

  it("rejects unexpected credential metadata in a session event", () => {
    const event = { ...sessionCreatedEvent, metadata: { token: "must-not-enter-audit" } };

    expect(() => Schema.decodeUnknownSync(RecordAuditEvent)(event)).toThrow();
  });
});
