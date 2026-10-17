import { ConfigProvider, Effect, Layer } from "effect";

import { afterEach, describe, expect, it, vi } from "vitest";

import { EmailProvider, type ProviderMessage } from "../../src/index.js";
import { ConfiguredEmailProvider, InboundEmail, ResendEmail } from "../../src/node/index.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("email SDK adapters", () => {
  it("uses the Resend SDK with both bodies, reply-to and the stable idempotency key", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ id: "resend-message" }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const message: ProviderMessage = {
      from: "Preface <preface@example.test>",
      to: "operator@example.test",
      replyTo: "support@example.test",
      subject: "Fixture",
      html: "<p>Fixture</p>",
      text: "Fixture",
      idempotencyKey: "stable-job-id",
    };
    const receipt = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* EmailProvider).send(message);
      }).pipe(
        Effect.provide(
          ResendEmail.layer.pipe(
            Layer.provide(
              ConfigProvider.layer(
                ConfigProvider.fromUnknown({ RESEND_API_KEY: "test-resend-key" }),
              ),
            ),
          ),
        ),
      ),
    );

    expect(receipt).toEqual({ provider: "resend", messageId: "resend-message" });
    const call = fetch.mock.calls[0];
    if (call === undefined) throw new Error("Expected the Resend SDK to make a request");
    const request = new Request(call[0], call[1]);
    expect(request.url).toBe("https://api.resend.com/emails");
    expect(request.headers.get("Idempotency-Key")).toBe("stable-job-id");
    expect(await request.json()).toMatchObject({
      html: message.html,
      text: message.text,
      reply_to: [message.replyTo],
    });
  });

  it("uses the Inbound SDK and leaves retries to the durable worker", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: "inbound-message" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetch);
    const message: ProviderMessage = {
      from: "preface@example.test",
      to: "operator@example.test",
      subject: "Fixture",
      html: "<p>Fixture</p>",
      text: "Fixture",
      idempotencyKey: "stable-job-id",
    };

    const receipt = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* EmailProvider).send(message);
      }).pipe(
        Effect.provide(
          InboundEmail.layer.pipe(
            Layer.provide(
              ConfigProvider.layer(
                ConfigProvider.fromUnknown({ INBOUND_API_KEY: "test-inbound-key" }),
              ),
            ),
          ),
        ),
      ),
    );

    expect(receipt).toEqual({ provider: "inbound", messageId: "inbound-message" });
    expect(fetch).toHaveBeenCalledTimes(1);
    const call = fetch.mock.calls[0];
    if (call === undefined) throw new Error("Expected the Inbound SDK to make a request");
    const request = new Request(call[0], call[1]);
    expect(request.url).toBe("https://inbound.new/api/e2/emails");
    expect(request.headers.get("Idempotency-Key")).toBe("stable-job-id");
    expect(await request.json()).toMatchObject({ html: message.html, text: message.text });
  });

  it("does not retry an uncertain Inbound outcome inside the SDK or expose its cause", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValue(new Error("sensitive transport details"));
    vi.stubGlobal("fetch", fetch);
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* EmailProvider)
          .send({
            from: "preface@example.test",
            to: "operator@example.test",
            subject: "Fixture",
            html: "<p>Fixture</p>",
            text: "Fixture",
            idempotencyKey: "stable-job-id",
          })
          .pipe(Effect.flip);
      }).pipe(
        Effect.provide(
          InboundEmail.layer.pipe(
            Layer.provide(
              ConfigProvider.layer(
                ConfigProvider.fromUnknown({ INBOUND_API_KEY: "test-inbound-key" }),
              ),
            ),
          ),
        ),
      ),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(error.code).toBe("UNKNOWN_OUTCOME");
    expect(error.retryable).toBe(false);
    expect(JSON.stringify(error)).not.toContain("sensitive transport details");
  });

  it("loads only the selected configuration and refuses development logging in production", async () => {
    const selected = ConfiguredEmailProvider.pipe(
      Layer.provide(
        ConfigProvider.layer(
          ConfigProvider.fromUnknown({
            EMAIL_PROVIDER: "resend",
            RESEND_API_KEY: "test-resend-key",
          }),
        ),
      ),
    );
    expect(
      await Effect.runPromise(
        EmailProvider.pipe(
          Effect.map((provider) => provider.name),
          Effect.provide(selected),
        ),
      ),
    ).toBe("resend");

    const forbidden = ConfiguredEmailProvider.pipe(
      Layer.provide(
        ConfigProvider.layer(
          ConfigProvider.fromUnknown({ EMAIL_PROVIDER: "development", NODE_ENV: "production" }),
        ),
      ),
    );
    const error = await Effect.runPromise(
      EmailProvider.pipe(Effect.provide(forbidden), Effect.flip),
    );
    expect(error).toMatchObject({ _tag: "ConfigError" });
  });
});
