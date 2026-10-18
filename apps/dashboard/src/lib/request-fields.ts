import { Predicate } from "effect";

// optionalKey distinguishes omission from a present undefined value. RHF and optional
// pagination parameters use undefined, so normalize plain request objects before encoding.
export function requestFields<A>(request: A): A {
  if (Array.isArray(request)) return request.map(requestFields) as A;
  if (!Predicate.isObject(request) || Object.getPrototypeOf(request) !== Object.prototype)
    return request;
  return Object.fromEntries(
    Object.entries(request)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, requestFields(value)]),
  ) as A;
}
