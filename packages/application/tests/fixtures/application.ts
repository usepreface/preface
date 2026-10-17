import { NodeCrypto } from "@effect/platform-node";
import { Layer } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../src/index.js";
import { NodePassword, NodeToken } from "../../src/node/index.js";

const port = process.env.PREFACE_TEST_POSTGRES_PORT;
export const DatabaseTestLayer: Layer.Layer<
  Layer.Success<typeof TestDatabase.layer>,
  unknown
> = port === undefined ? TestDatabase.layer : TestDatabase.postgresLayer(Number(port));

export const RepositoryTestLayer = DatabaseRepository.layer.pipe(
  Layer.provideMerge(DatabaseTestLayer),
);
export const SecurityTestLayer = Layer.mergeAll(NodePassword.layer, NodeToken.layer).pipe(
  Layer.provide(NodeCrypto.layer),
);
export const ApplicationTestLayer = Application.layer.pipe(
  Layer.provideMerge(SecurityTestLayer),
  Layer.provideMerge(RepositoryTestLayer),
);
