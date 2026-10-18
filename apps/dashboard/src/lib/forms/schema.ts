import { Schema, SchemaIssue } from "effect";
import type { StandardSchemaV1 } from "effect/StandardSchema";

/*
 * Turns a protocol Effect schema into a Standard Schema for react-hook-form. Effect's default
 * messages describe the check ("Expected a value with a length of at least 1"); forms need short
 * sentences a person can act on. Generic checks get a generic sentence here, and each form can
 * replace the "required" and "format" sentences per field, keyed by the field's dot path.
 */

const REQUIRED = "Required.";
const FORMAT = "Check the format.";

type Representation = { readonly id?: string; readonly payload?: Record<string, unknown> };

function checkMessage(issue: SchemaIssue.Filter): string | undefined {
  const annotations = issue.filter.annotations;
  if (typeof annotations?.message === "string") return annotations.message;

  const representation = annotations?.representation as Representation | undefined;
  const payload = representation?.payload ?? {};

  switch (representation?.id) {
    case "effect/schema/isMinLength":
      return payload.minLength === 1
        ? REQUIRED
        : `Use at least ${String(payload.minLength)} characters.`;
    case "effect/schema/isMaxLength":
      return `Use ${String(payload.maxLength)} characters or fewer.`;
    case "effect/schema/isPattern":
    case "effect/schema/isUUID":
      return FORMAT;
    case "effect/schema/isTrimmed":
      return "Remove the spaces at the start or end.";
    case "effect/schema/isUnique":
      return "Each item can only be added once.";
    default:
      return FORMAT;
  }
}

function leafMessage(issue: SchemaIssue.Leaf): string {
  return issue instanceof SchemaIssue.MissingKey || issue instanceof SchemaIssue.InvalidType
    ? REQUIRED
    : FORMAT;
}

export type FieldMessages = {
  /** Replaces "Required." for these fields, e.g. `{ email: "Enter your work email." }`. */
  readonly required?: Readonly<Record<string, string>>;
  /** Replaces "Check the format." for these fields. */
  readonly format?: Readonly<Record<string, string>>;
};

function pathKey(issue: StandardSchemaV1.Issue): string {
  return (issue.path ?? [])
    .map((segment) => String(typeof segment === "object" ? segment.key : segment))
    .join(".");
}

export function toFormSchema<S extends Schema.Top & Schema.ConstraintDecoder<unknown>>(
  schema: S,
  messages: FieldMessages = {},
): StandardSchemaV1<S["Encoded"], S["Type"]> {
  // `toStandardSchemaV1` attaches itself to the schema it is given, so hand it a copy and keep the
  // shared protocol schema untouched.
  const standard = Schema.toStandardSchemaV1(schema.annotate({}) as S, {
    checkHook: checkMessage,
    leafHook: leafMessage,
  });

  const rewrite = (issue: StandardSchemaV1.Issue): StandardSchemaV1.Issue => {
    const key = pathKey(issue);
    const replacement =
      issue.message === REQUIRED
        ? messages.required?.[key]
        : issue.message === FORMAT
          ? messages.format?.[key]
          : undefined;
    return replacement ? { ...issue, message: replacement } : issue;
  };

  const finish = (result: StandardSchemaV1.Result<S["Type"]>) =>
    result.issues ? { issues: result.issues.map(rewrite) } : result;

  return {
    "~standard": {
      version: 1,
      vendor: "preface",
      validate: (value) => {
        const result = standard["~standard"].validate(value);
        return result instanceof Promise ? result.then(finish) : finish(result);
      },
    },
  };
}
