import { Schema } from "effect";
import { HttpApiSchema } from "effect/http-api";

import { BootstrapError, RequestError, RequestErrorCode } from "@usepreface/protocol";

export const requestErrorStatuses = {
  INVALID_INPUT: 400,
  FORBIDDEN: 403,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  REQUEST_TIMEOUT: 408,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const satisfies Readonly<Record<RequestErrorCode, number>>;

export const requestErrors = RequestErrorCode.literals.map((code) =>
  Schema.Struct({ ...RequestError.fields, code: Schema.Literal(code) }).pipe(
    HttpApiSchema.status(requestErrorStatuses[code]),
  ),
);

export const bootstrapErrors = [
  Schema.Struct({ ...BootstrapError.fields, code: Schema.Literal("INVALID_INPUT") }).pipe(
    HttpApiSchema.status(400),
  ),
  Schema.Struct({ ...BootstrapError.fields, code: Schema.Literal("INVALID_TOKEN") }).pipe(
    HttpApiSchema.status(401),
  ),
  Schema.Struct({
    ...BootstrapError.fields,
    code: Schema.Literals(["ALREADY_COMPLETED", "EMAIL_UNAVAILABLE"]),
  }).pipe(HttpApiSchema.status(409)),
] as const;
