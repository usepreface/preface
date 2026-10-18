import { Schema } from "effect";

import { DomainNameInput } from "#/common/domain";

export const CreateDomainInput = Schema.Struct({ domain: DomainNameInput });
export type CreateDomainInput = typeof CreateDomainInput.Type;
