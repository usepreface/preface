import { Context, Effect, Layer } from "effect";

import { TransactionService } from "#/core/transaction";
import { BootstrapChallengeRepository } from "#/repositories/instance/bootstrap-challenge";
import { InstallationRepository } from "#/repositories/instance/installation";
import { InstanceOwnerRepository } from "#/repositories/instance/owner";
import { InstanceSettingsRepository } from "#/repositories/instance/settings";

const makeInstanceRepository = Effect.gen(function* () {
  const installation = yield* InstallationRepository;
  const settings = yield* InstanceSettingsRepository;
  const owner = yield* InstanceOwnerRepository;
  const challenge = yield* BootstrapChallengeRepository;
  const transaction = yield* TransactionService;

  return {
    installation,
    settings,
    owner,
    challenge,
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
        BootstrapChallengeRepository.layer,
      ),
    ),
  );
}

export {
  InstallationRepository,
  InstanceSettingsRepository,
  InstanceOwnerRepository,
  BootstrapChallengeRepository,
};
