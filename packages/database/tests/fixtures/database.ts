import { Layer } from "effect";

import { InstanceRepository } from "../../src/index.js";
import { TestDatabase } from "../../src/testing/index.js";

const port = process.env.PREFACE_TEST_POSTGRES_PORT;

export const DatabaseTestLayer: Layer.Layer<
  Layer.Success<typeof TestDatabase.layer>,
  unknown
> = port === undefined ? TestDatabase.layer : TestDatabase.postgresLayer(Number(port));

export const InstanceTestLayer = InstanceRepository.layer.pipe(
  Layer.provideMerge(DatabaseTestLayer),
);
