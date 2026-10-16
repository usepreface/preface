import { Context, Effect, Layer } from "effect";

import { TransactionService } from "#/core/transaction";
import { InstallationRepository } from "#/repositories/instance/installation";
import { InstanceOwnerRepository } from "#/repositories/instance/owner";
import { InstanceSettingsRepository } from "#/repositories/instance/settings";

const makeInstanceRepository = Effect.gen(function* () {
  const installation = yield* InstallationRepository;
  const settings = yield* InstanceSettingsRepository;
  const owner = yield* InstanceOwnerRepository;
  const transaction = yield* TransactionService;

  return {
    installation,
    settings,
    owner,
    initialize: Effect.fn("InstanceRepository.initialize")(() =>
      transaction.run(
        Effect.gen(function* () {
          const initialized = yield* installation.initialize();
          const defaults = yield* settings.initialize();
          return { ...initialized, settings: defaults };
        }),
      ),
    ),
  };
});

export class InstanceRepository extends Context.Service<
  InstanceRepository,
  Effect.Success<typeof makeInstanceRepository>
>()("@usepreface/database/repositories/instance/InstanceRepository") {
  static readonly layer = Layer.effect(InstanceRepository, makeInstanceRepository).pipe(
    Layer.provide(
      Layer.mergeAll(
        InstallationRepository.layer,
        InstanceSettingsRepository.layer,
        InstanceOwnerRepository.layer,
      ),
    ),
  );
}

export { InstallationRepository, InstanceSettingsRepository, InstanceOwnerRepository };
