import { Schema } from "effect";

export const RequestErrorCode = Schema.Literals([
  "INVALID_INPUT",
  "FORBIDDEN",
  "PAYLOAD_TOO_LARGE",
  "UNSUPPORTED_MEDIA_TYPE",
  "RATE_LIMITED",
  "REQUEST_TIMEOUT",
  "NOT_FOUND",
  "INTERNAL_ERROR",
  "SERVICE_UNAVAILABLE",
]);
export type RequestErrorCode = typeof RequestErrorCode.Type;

// HTTP boundary failures contain no request values, provider causes or SQL details.
export class RequestError extends Schema.TaggedError<RequestError>()("RequestError", {
  code: RequestErrorCode,
}) {}
