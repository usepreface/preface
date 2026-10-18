import type { StandardSchemaV1 } from "effect/StandardSchema";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm, type FieldValues, type UseFormProps, type UseFormReturn } from "react-hook-form";

/**
 * `useForm` validated by a schema from `#/forms`. Fields validate once they have been touched and
 * then on every change, so errors appear after the person leaves a field, not while they type.
 */
export function useSchemaForm<Input extends FieldValues, Output>(
  schema: StandardSchemaV1<Input, Output>,
  options: Omit<UseFormProps<Input, unknown, Output>, "resolver">,
) {
  return useForm<Input, unknown, Output>({
    mode: "onTouched",
    ...options,
    resolver: standardSchemaResolver(schema),
  });
}

/** The form returned by `useSchemaForm` for a schema, for components that render part of it. */
export type SchemaForm<S> =
  S extends StandardSchemaV1<infer Input extends FieldValues, infer Output>
    ? UseFormReturn<Input, unknown, Output>
    : never;
