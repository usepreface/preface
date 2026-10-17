import { NodeServices } from "@effect/platform-node";
import { Layer } from "effect";

import { Application } from "@usepreface/application";
import { NodePassword, NodeToken } from "@usepreface/application/node";
import {
  Database,
  DatabaseMigration,
  DatabaseRepository,
  TransactionService,
} from "@usepreface/database";

import { ServerConfig } from "#/config";

const PersistenceLive = Layer.mergeAll(DatabaseRepository.layer, DatabaseMigration.layer).pipe(
  Layer.provideMerge(TransactionService.layer.pipe(Layer.provideMerge(Database.layer))),
);
const SecurityLive = Layer.mergeAll(NodePassword.layer, NodeToken.layer);

export const BackendLive = Layer.mergeAll(
  Application.layer.pipe(Layer.provide(SecurityLive), Layer.provideMerge(PersistenceLive)),
  ServerConfig.layer,
).pipe(Layer.provide(NodeServices.layer));
