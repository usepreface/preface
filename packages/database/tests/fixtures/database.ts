import { Layer } from "effect";

import { DatabaseRepository, InstanceRepository } from "../../src/index.js";
import { TestDatabase } from "../../src/testing/index.js";

const port = process.env.PREFACE_TEST_POSTGRES_PORT;

export const DatabaseTestLayer: Layer.Layer<
  Layer.Success<typeof TestDatabase.layer>,
  unknown
> = port === undefined
  ? TestDatabase.layer
  : TestDatabase.postgresLayer(Number(port), process.env.PREFACE_TEST_POSTGRES_PASSWORD);

export const InstanceTestLayer = InstanceRepository.layer.pipe(
  Layer.provideMerge(DatabaseTestLayer),
);

export const RepositoryTestLayer = DatabaseRepository.layer.pipe(
  Layer.provideMerge(DatabaseTestLayer),
);
