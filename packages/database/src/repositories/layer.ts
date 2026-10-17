import { Context, Effect, Layer } from "effect";

import { AuditEventRepository } from "#/repositories/audit/index";
import {
  SsoReplayRepository,
  SessionRepository,
  IdentityConnectionRepository,
  AccountRepository,
  AuthFlowRepository,
  UserRepository,
  UserEmailRepository,
  VerificationRepository,
  SessionAuthenticationRepository,
} from "#/repositories/auth/index";
import { InstanceRepository } from "#/repositories/instance/index";
import { EmailJobRepository } from "#/repositories/jobs/email";
import { OrganizationRepositories } from "#/repositories/organization/index";

const makeDatabaseRepository = Effect.gen(function* () {
  const organization = yield* OrganizationRepositories;
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
    organization,
    auth: {
      user,
      userEmail,
      session,
      verification,
      sessionAuthentication,
      identityConnection: yield* IdentityConnectionRepository,
      account: yield* AccountRepository,
      authFlow: yield* AuthFlowRepository,
      ssoReplay: yield* SsoReplayRepository,
    },
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
        IdentityConnectionRepository.layer,
        AccountRepository.layer,
        AuthFlowRepository.layer,
        SsoReplayRepository.layer,
        InstanceRepository.layer,
        OrganizationRepositories.layer,
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
