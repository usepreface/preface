import { Record, Schema } from "effect";
import { HttpApiSchema } from "effect/http-api";

import { BootstrapError, RequestError } from "@usepreface/protocol";

export const requestErrorStatuses = RequestError.statuses;

export const requestErrors = Record.keys(RequestError.statuses).map((code) =>
  Schema.Struct({ ...RequestError.fields, code: Schema.Literal(code) }).pipe(
    HttpApiSchema.status(RequestError.statuses[code]),
  ),
);

export const bootstrapErrors = Record.keys(BootstrapError.statuses).map((code) =>
  Schema.Struct({ ...BootstrapError.fields, code: Schema.Literal(code) }).pipe(
    HttpApiSchema.status(BootstrapError.statuses[code]),
  ),
);
