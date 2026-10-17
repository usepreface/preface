import { Record, Schema } from "effect";

const requestErrorStatuses = {
  INVALID_INPUT: 400,
  FORBIDDEN: 403,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  REQUEST_TIMEOUT: 408,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const RequestErrorCode = Schema.Literals(Record.keys(requestErrorStatuses));
export type RequestErrorCode = typeof RequestErrorCode.Type;

// HTTP boundary failures contain no request values, provider causes or SQL details.
export class RequestError extends Schema.TaggedError<RequestError>()("RequestError", {
  code: RequestErrorCode,
}) {
  static readonly statuses = requestErrorStatuses;
}
