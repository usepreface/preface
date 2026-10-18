import { CreateDomainInput } from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

export const domainForm = toFormSchema(CreateDomainInput, {
  required: { domain: "Enter a domain." },
  format: { domain: "Enter a domain like acme.dev, without https:// or a path." },
});
