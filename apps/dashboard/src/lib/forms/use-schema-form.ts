import type { StandardSchemaV1 } from "effect/StandardSchema";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  useForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
  type UseFormHandleSubmit,
} from "react-hook-form";

type SchemaFormReturn<Input extends FieldValues, Output> = Omit<
  UseFormReturn<Input, unknown, Input>,
  "handleSubmit"
> & {
  readonly handleSubmit: UseFormHandleSubmit<Input, Output>;
};

export function useSchemaForm<Input extends FieldValues, Output>(
  schema: StandardSchemaV1<Input, Output>,
  options: Omit<UseFormProps<Input, unknown, Input>, "resolver">,
): SchemaFormReturn<Input, Output> {
  const form = useForm<Input, unknown, Input>({
    mode: "onTouched",
    ...options,
    resolver: standardSchemaResolver(schema, undefined, { raw: true }),
  });

  // RHF clones resolver values on submit. Decode after that boundary so identity-backed
  // Effect values (notably Redacted) retain their registry entry instead of becoming clones.
  const handleSubmit: UseFormHandleSubmit<Input, Output> = (onValid, onInvalid) =>
    form.handleSubmit(async (values, event) => {
      const decoded = await schema["~standard"].validate(values);
      if (decoded.issues) {
        form.setError("root", {
          message: "The form changed during validation. Review the fields and submit again.",
        });
        return;
      }
      return onValid(decoded.value, event);
    }, onInvalid);

  return { ...form, handleSubmit };
}

export type SchemaForm<S> =
  S extends StandardSchemaV1<infer Input extends FieldValues, infer Output>
    ? SchemaFormReturn<Input, Output>
    : never;
