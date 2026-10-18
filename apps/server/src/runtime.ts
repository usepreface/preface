import { NodeServices } from "@effect/platform-node";
import { Effect, Layer } from "effect";

import { Application, AuthenticationLinks } from "@usepreface/application";
import {
  NodeToken,
  NodeGoogleIdentity,
  NodeOidcIdentity,
  NodeSamlIdentity,
  NodeDomainDns,
} from "@usepreface/application/node";
import { NodeSecretCrypto, NodeTokenCrypto, NodeCertificateCrypto } from "@usepreface/crypto/node";
import {
  Database,
  DatabaseMigration,
  DatabaseRepository,
  TransactionService,
} from "@usepreface/database";
import {
  EmailDelivery,
  EmailJobs,
  EmailPayloadCipher,
  EmailSender,
  EmailService,
  AuthenticationEmailRenderer,
} from "@usepreface/emails";
import { ConfiguredEmailProvider } from "@usepreface/emails/node";

import { ServerConfig } from "#/config";

const LinksLive = Layer.effect(
  AuthenticationLinks,
  Effect.gen(function* () {
    const config = yield* ServerConfig;
    return { publicOrigin: config.publicUrl.origin };
  }),
).pipe(Layer.provide(ServerConfig.layer));

const OidcLive = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* ServerConfig;
    return NodeOidcIdentity.layer(config.oidcAllowedPrivateOrigins.map((url) => url.origin));
  }),
).pipe(Layer.provide(ServerConfig.layer));

const PersistenceLive = Layer.mergeAll(DatabaseRepository.layer, DatabaseMigration.layer).pipe(
  Layer.provideMerge(TransactionService.layer.pipe(Layer.provideMerge(Database.layer))),
);
const CryptoLive = Layer.mergeAll(
  NodeToken.layer,
  NodeTokenCrypto.layer,
  NodeSecretCrypto.layer,
  NodeCertificateCrypto.layer,
);
const CipherLive = EmailPayloadCipher.layer.pipe(Layer.provide(CryptoLive));
const EmailLive = EmailService.layer.pipe(
  Layer.provide(Layer.mergeAll(AuthenticationEmailRenderer.layer, EmailSender.layer)),
  Layer.provideMerge(ConfiguredEmailProvider),
);
const JobsLive = EmailJobs.layer.pipe(Layer.provideMerge(CipherLive));

export const BackendLive = Layer.mergeAll(Application.layer, EmailDelivery.layer).pipe(
  Layer.provideMerge(JobsLive),
  Layer.provide(EmailLive),
  Layer.provide(LinksLive),
  Layer.provide(NodeGoogleIdentity.layer),
  Layer.provide(OidcLive),
  Layer.provide(NodeSamlIdentity.layer),
  Layer.provide(NodeDomainDns.layer),
  Layer.provide(CryptoLive),
  Layer.provideMerge(PersistenceLive),
  Layer.merge(ServerConfig.layer),
  Layer.provide(NodeServices.layer),
);
