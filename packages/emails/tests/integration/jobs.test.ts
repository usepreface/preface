import { expect, layer } from "@effect/vitest";
import { DateTime, Effect } from "effect";
import { TestClock } from "effect/testing";

import { Database, DatabaseRepository, TransactionService } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import {
  EmailDelivery,
  EmailJobs,
  EmailPayloadCipher,
  EmailProviderError,
} from "../../src/index.js";
import { TestEmails } from "../../src/testing/index.js";
import { EmailTestLayer, signInEmail } from "../fixtures/email.js";

layer(EmailTestLayer)("durable email jobs", (it) => {
  it.effect("rolls back the email intent with its originating business change", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const jobs = yield* EmailJobs;
      const repository = yield* DatabaseRepository;
      const transaction = yield* TransactionService;
      const input = yield* signInEmail;

      const failure = yield* transaction
        .run(
          Effect.gen(function* () {
            yield* repository.instance.initialize();
            yield* jobs.enqueue(input);
            return yield* Effect.fail("business-rejected");
          }),
        )
        .pipe(Effect.flip);

      expect(failure).toBe("business-rejected");
      expect(yield* repository.instance.installation.find()).toBeUndefined();
      expect(yield* (yield* EmailDelivery).processOnce).toBe(0);
    }),
  );

  it.effect(
    "encrypts payloads, deduplicates retries and rejects a reused key with different content",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const jobs = yield* EmailJobs;
        const repository = (yield* DatabaseRepository).jobs.email;
        const input = yield* signInEmail;

        const id = yield* jobs.enqueue(input);
        expect(yield* jobs.enqueue(input)).toBe(id);
        const conflict = yield* jobs
          .enqueue({ ...input, to: "another@example.test" })
          .pipe(Effect.flip);
        expect(conflict).toMatchObject({ _tag: "EmailError", code: "IDEMPOTENCY_CONFLICT" });

        const stored = yield* repository.findById(id);
        expect(stored?.encryptedPayload).not.toContain(input.to);
        expect(stored?.encryptedPayload).not.toContain(input.variables.code);
        expect(stored?.encryptedPayload).toMatch(/^v1\./);
        expect(yield* (yield* TestEmails).sent).toHaveLength(0);
      }),
  );

  it.effect("renders and delivers after enqueue, then clears the recoverable payload", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const captured = yield* TestEmails;
      yield* captured.clear;
      const id = yield* (yield* EmailJobs).enqueue(yield* signInEmail);

      expect(yield* (yield* EmailDelivery).processOnce).toBe(1);
      const sent = yield* captured.sent;
      expect(sent).toHaveLength(1);
      expect(sent[0]?.text).toBe("48271936");
      expect(sent[0]?.idempotencyKey).toBe(id);
      const stored = yield* (yield* DatabaseRepository).jobs.email.findById(id);
      expect(stored?.status).toBe("sent");
      expect(stored?.encryptedPayload).toBeNull();
    }),
  );

  it.effect(
    "retries transient rejection with the same delivery key and terminates permanent rejection",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const captured = yield* TestEmails;
        yield* captured.clear;
        const jobs = yield* EmailJobs;
        const delivery = yield* EmailDelivery;
        const repository = (yield* DatabaseRepository).jobs.email;
        const input = yield* signInEmail;
        const id = yield* jobs.enqueue(input);
        yield* captured.failNext(new EmailProviderError({ code: "RATE_LIMITED", retryable: true }));

        yield* delivery.processOnce;
        expect((yield* repository.findById(id))?.status).toBe("pending");
        expect(yield* delivery.processOnce).toBe(0);
        yield* TestClock.adjust("5 seconds");
        yield* delivery.processOnce;
        expect((yield* captured.sent)[0]?.idempotencyKey).toBe(id);
        expect((yield* repository.findById(id))?.attempts).toBe(2);

        const rejected = yield* jobs.enqueue({ ...input, idempotencyKey: "sign-in:rejected" });
        yield* captured.failNext(new EmailProviderError({ code: "REJECTED", retryable: false }));
        yield* delivery.processOnce;
        const failed = yield* repository.findById(rejected);
        expect(failed?.status).toBe("failed");
        expect(failed?.lastErrorCode).toBe("REJECTED");
        expect(failed?.encryptedPayload).toBeNull();
      }),
  );

  it.effect("does not deliver cancelled or expired jobs", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const captured = yield* TestEmails;
      yield* captured.clear;
      const jobs = yield* EmailJobs;
      const input = yield* signInEmail;
      const cancelled = yield* jobs.enqueue(input);
      const expired = yield* jobs.enqueue({ ...input, idempotencyKey: "sign-in:expires" });

      yield* jobs.cancel(cancelled);
      yield* TestClock.setTime(DateTime.toEpochMillis(input.expiresAt));
      expect(yield* (yield* EmailDelivery).processOnce).toBe(0);
      const repository = (yield* DatabaseRepository).jobs.email;
      expect((yield* repository.findById(cancelled))?.status).toBe("cancelled");
      const stored = yield* repository.findById(expired);
      expect(stored?.status).toBe("expired");
      expect(stored?.encryptedPayload).toBeNull();
      expect(yield* captured.sent).toHaveLength(0);
    }),
  );

  it.effect("rejects tampered ciphertext without sending or retaining credentials", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const captured = yield* TestEmails;
      yield* captured.clear;
      const id = yield* (yield* EmailJobs).enqueue(yield* signInEmail);
      const database = yield* Database;
      yield* database.$client`update jobs.email set encrypted_payload = 'v1.invalid.invalid.invalid' where id = ${id}`;

      yield* (yield* EmailDelivery).processOnce;
      const stored = yield* (yield* DatabaseRepository).jobs.email.findById(id);
      expect(stored?.status).toBe("failed");
      expect(stored?.lastErrorCode).toBe("DECRYPT_FAILED");
      expect(stored?.encryptedPayload).toBeNull();
      expect(yield* captured.sent).toHaveLength(0);
    }),
  );

  it.effect("reclaims an abandoned lease and prevents stale workers from completing it", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const id = yield* (yield* EmailJobs).enqueue(yield* signInEmail);
      const repository = (yield* DatabaseRepository).jobs.email;
      const first = yield* repository.claim({
        leaseToken: "first-worker",
        leaseExpiresAt: DateTime.addDuration(yield* DateTime.now, "30 seconds"),
        maximumAttempts: 5,
        provider: "resend",
        supportsIdempotency: true,
        replayAfter: DateTime.subtractDuration(yield* DateTime.now, "1 hour"),
      });
      expect(first?.id).toBe(id);
      yield* TestClock.adjust("30 seconds");
      const replacement = yield* repository.claim({
        leaseToken: "replacement",
        leaseExpiresAt: DateTime.addDuration(yield* DateTime.now, "30 seconds"),
        maximumAttempts: 5,
        provider: "resend",
        supportsIdempotency: true,
        replayAfter: DateTime.subtractDuration(yield* DateTime.now, "1 hour"),
      });
      expect(replacement?.attempts).toBe(2);

      expect(
        yield* repository.finish({
          id,
          leaseToken: "first-worker",
          status: "sent",
          providerMessageId: "stale",
        }),
      ).toBeUndefined();
      expect(
        (yield* repository.finish({
          id,
          leaseToken: "replacement",
          status: "sent",
          providerMessageId: "accepted",
        }))?.status,
      ).toBe("sent");
    }),
  );

  it.effect("does not replay uncertain SMTP sends or abandoned final attempts", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const jobs = yield* EmailJobs;
      const input = yield* signInEmail;
      const smtp = yield* jobs.enqueue(input);
      const exhausted = yield* jobs.enqueue({ ...input, idempotencyKey: "sign-in:final-attempt" });
      const repository = (yield* DatabaseRepository).jobs.email;
      yield* repository.claim({
        leaseToken: "smtp-worker",
        leaseExpiresAt: DateTime.addDuration(yield* DateTime.now, "30 seconds"),
        maximumAttempts: 5,
        provider: "smtp",
        supportsIdempotency: false,
        replayAfter: DateTime.subtractDuration(yield* DateTime.now, "1 hour"),
      });
      yield* repository.claim({
        leaseToken: "last-worker",
        leaseExpiresAt: DateTime.addDuration(yield* DateTime.now, "30 seconds"),
        maximumAttempts: 5,
        provider: "resend",
        supportsIdempotency: true,
        replayAfter: DateTime.subtractDuration(yield* DateTime.now, "1 hour"),
      });
      const database = yield* Database;
      yield* database.$client`update jobs.email set attempts = 5 where id = ${exhausted}`;

      yield* TestClock.adjust("30 seconds");
      expect(
        yield* repository.claim({
          leaseToken: "recovery",
          leaseExpiresAt: DateTime.addDuration(yield* DateTime.now, "30 seconds"),
          maximumAttempts: 5,
          provider: "smtp",
          supportsIdempotency: false,
          replayAfter: DateTime.subtractDuration(yield* DateTime.now, "1 hour"),
        }),
      ).toBeUndefined();
      expect((yield* repository.findById(smtp))?.status).toBe("failed");
      expect((yield* repository.findById(smtp))?.lastErrorCode).toBe("UNKNOWN_OUTCOME");
      expect((yield* repository.findById(exhausted))?.lastErrorCode).toBe("ATTEMPTS_EXHAUSTED");
    }),
  );

  it.effect("does not replay an abandoned send after the safe replay window", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const input = yield* signInEmail;
      const expiresAt = DateTime.addDuration(yield* DateTime.now, "2 days");
      const id = yield* (yield* EmailJobs).enqueue({
        ...input,
        expiresAt,
        variables: { ...input.variables, expiresAt },
      });
      const repository = (yield* DatabaseRepository).jobs.email;
      yield* repository.claim({
        leaseToken: "abandoned",
        leaseExpiresAt: DateTime.addDuration(yield* DateTime.now, "30 seconds"),
        maximumAttempts: 5,
        provider: "resend",
        supportsIdempotency: true,
        replayAfter: DateTime.subtractDuration(yield* DateTime.now, "1 hour"),
      });

      yield* TestClock.adjust("2 hours");
      expect(yield* (yield* EmailDelivery).processOnce).toBe(0);
      const stored = yield* repository.findById(id);
      expect(stored?.status).toBe("failed");
      expect(stored?.lastErrorCode).toBe("UNKNOWN_OUTCOME");
      expect(stored?.encryptedPayload).toBeNull();
    }),
  );

  it.effect("rejects unauthentic ciphertext even with a valid structure", () =>
    Effect.gen(function* () {
      const cipher = yield* EmailPayloadCipher;
      const encrypted = yield* cipher.encrypt("secret");
      const segments = encrypted.split(".");
      segments[2] = Buffer.from("modified").toString("base64url");
      const error = yield* cipher.decrypt(segments.join(".")).pipe(Effect.flip);
      expect(error.code).toBe("DECRYPT_FAILED");
    }),
  );
});
