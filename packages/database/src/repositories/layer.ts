import { Context, Effect, Layer } from "effect";

import { AuditEventRepository } from "#/repositories/audit/index";
import {
  SessionRepository,
  UserRepository,
  UserEmailRepository,
  VerificationRepository,
  SessionAuthenticationRepository,
} from "#/repositories/auth/index";
import { InstanceRepository } from "#/repositories/instance/index";
import { EmailJobRepository } from "#/repositories/jobs/email";

const makeDatabaseRepository = Effect.gen(function* () {
  const instance = yield* InstanceRepository;
  const user = yield* UserRepository;
  const session = yield* SessionRepository;
  const userEmail = yield* UserEmailRepository;
  const verification = yield* VerificationRepository;
  const sessionAuthentication = yield* SessionAuthenticationRepository;
  const event = yield* AuditEventRepository;
  const email = yield* EmailJobRepository;

  return {
    instance,
    auth: { user, userEmail, session, verification, sessionAuthentication },
    audit: { event },
    jobs: { email },
  } as const;
});

export class DatabaseRepository extends Context.Service<
  DatabaseRepository,
  Effect.Success<typeof makeDatabaseRepository>
>()("@usepreface/database/repositories/DatabaseRepository") {
  static readonly layer = Layer.effect(DatabaseRepository, makeDatabaseRepository).pipe(
    Layer.provide(
      Layer.mergeAll(
        InstanceRepository.layer,
        UserRepository.layer,
        UserEmailRepository.layer,
        VerificationRepository.layer,
        SessionAuthenticationRepository.layer,
        SessionRepository.layer,
        AuditEventRepository.layer,
        EmailJobRepository.layer,
      ),
    ),
  );
}
