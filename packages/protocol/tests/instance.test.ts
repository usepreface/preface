import { DateTime, Schema } from "effect";

import { describe, expect, it } from "vitest";

import { InstallationId, UserId } from "../src/index.js";
import {
  GrantInstanceOwner,
  Installation,
  InstanceOwner,
  UpdateInstanceSettings,
} from "../src/model/index.js";

const uuid = "0199ecc0-0000-7000-8000-000000000001";
const createdAt = new Date("2026-10-16T12:00:00.000Z");
const expiresAt = new Date("2026-10-16T12:30:00.000Z");
const installation = {
  id: 1,
  installationId: uuid,
  createdAt,
  bootstrapCompletedAt: null,
  bootstrapTokenHash: null,
  bootstrapTokenIssuedAt: null,
  bootstrapTokenExpiresAt: null,
} as const;

describe("instance contracts", () => {
  it("validates UUIDv7 identities", () => {
    expect(Schema.decodeSync(InstallationId)(uuid)).toBe(uuid);
    expect(() => Schema.decodeSync(UserId)("not-a-uuid")).toThrow();
    expect(() =>
      Schema.decodeSync(InstallationId)("550e8400-e29b-41d4-a716-446655440000"),
    ).toThrow();
  });

  it("decodes driver dates into DateTime instants and encodes them back", () => {
    const decoded = Schema.decodeSync(Installation)(installation);
    expect(DateTime.toEpochMillis(decoded.createdAt)).toBe(createdAt.getTime());
    expect(Schema.encodeSync(Installation)(decoded)).toEqual(installation);
  });

  it.each([
    { bootstrapTokenHash: "digest" },
    {
      bootstrapTokenHash: "",
      bootstrapTokenIssuedAt: createdAt,
      bootstrapTokenExpiresAt: expiresAt,
    },
    {
      bootstrapTokenHash: "digest",
      bootstrapTokenIssuedAt: expiresAt,
      bootstrapTokenExpiresAt: createdAt,
    },
    {
      bootstrapTokenHash: "digest",
      bootstrapTokenIssuedAt: createdAt,
      bootstrapTokenExpiresAt: createdAt,
    },
    {
      bootstrapTokenHash: "digest",
      bootstrapTokenIssuedAt: createdAt,
      bootstrapTokenExpiresAt: expiresAt,
      bootstrapCompletedAt: expiresAt,
    },
  ])("rejects inconsistent bootstrap state %#", (changes) => {
    expect(() => Schema.decodeSync(Installation)({ ...installation, ...changes })).toThrow();
  });

  it("accepts a live setup token and a completed installation with no token", () => {
    expect(() =>
      Schema.decodeSync(Installation)({
        ...installation,
        bootstrapTokenHash: "digest",
        bootstrapTokenIssuedAt: createdAt,
        bootstrapTokenExpiresAt: expiresAt,
      }),
    ).not.toThrow();
    expect(() =>
      Schema.decodeSync(Installation)({ ...installation, bootstrapCompletedAt: expiresAt }),
    ).not.toThrow();
  });

  it.each(["", " ", " Preface", "Preface ", "a".repeat(121)])(
    "rejects an invalid instance name %j",
    (displayName) => {
      expect(() =>
        Schema.decodeSync(UpdateInstanceSettings)({ displayName, revision: 1 }),
      ).toThrow();
    },
  );

  it.each([0, -1, 1.5])("rejects an invalid settings revision %j", (revision) => {
    expect(() =>
      Schema.decodeSync(UpdateInstanceSettings)({ displayName: "Preface", revision }),
    ).toThrow();
  });

  it("requires actor attribution for owner-issued grants", () => {
    expect(() =>
      Schema.decodeSync(GrantInstanceOwner)({
        userId: uuid,
        grantSource: "owner",
        grantedByUserId: null,
      }),
    ).toThrow();
    expect(() =>
      Schema.decodeSync(GrantInstanceOwner)({
        userId: uuid,
        grantSource: "owner",
        grantedByUserId: uuid,
      }),
    ).not.toThrow();
    expect(() =>
      Schema.decodeSync(GrantInstanceOwner)({
        userId: uuid,
        grantSource: "bootstrap",
        grantedByUserId: uuid,
      }),
    ).toThrow();
  });

  it("validates grant revocation chronology and metadata", () => {
    const grant = {
      id: uuid,
      installationId: 1,
      userId: uuid,
      grantSource: "bootstrap",
      grantedByUserId: null,
      grantedAt: expiresAt,
      revokedAt: null,
      revokedByUserId: null,
      revocationReason: null,
    } as const;
    expect(() => Schema.decodeSync(InstanceOwner)(grant)).not.toThrow();
    expect(() =>
      Schema.decodeSync(InstanceOwner)({ ...grant, revocationReason: "removed" }),
    ).toThrow();
    expect(() => Schema.decodeSync(InstanceOwner)({ ...grant, revokedAt: createdAt })).toThrow();
  });
});
