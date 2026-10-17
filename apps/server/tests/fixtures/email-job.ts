import { Effect, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { EmailPayloadCipher } from "@usepreface/emails";
import type { EmailJobId } from "@usepreface/protocol";
import { EmailPayload } from "@usepreface/protocol/model";

export const readEmailJob = Effect.fnUntraced(function* (id: EmailJobId) {
  const job = yield* (yield* DatabaseRepository).jobs.email.findById(id);
  if (job === undefined || job.encryptedPayload === null)
    return yield* Effect.die(new Error("Expected a queued email"));
  return yield* Schema.decodeUnknownEffect(Schema.fromJsonString(EmailPayload))(
    yield* (yield* EmailPayloadCipher).decrypt(job.encryptedPayload),
  );
});
