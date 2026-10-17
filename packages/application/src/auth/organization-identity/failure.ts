import { Effect } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import type { AuthFlow } from "@usepreface/protocol/model";

export const makeExternalFlowFailure = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  return Effect.fn("ExternalFlow.fail")(function* (flow: AuthFlow) {
    yield* transaction.run(
      Effect.gen(function* () {
        yield* repository.auth.authFlow.revoke(flow.id);
        yield* repository.audit.event.append({
          actorKind: flow.expectedUserId === null ? "system" : "user",
          actorUserId: flow.expectedUserId,
          ...(flow.targetOrganizationId === null
            ? {}
            : { organizationId: flow.targetOrganizationId }),
          eventType: "auth.external_flow_failed",
          targetType: "auth_flow",
          targetId: flow.id,
          metadata: { intent: flow.intent },
        });
      }),
    );
  });
});
