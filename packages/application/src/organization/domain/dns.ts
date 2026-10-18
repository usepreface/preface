import { Context, type Effect } from "effect";

import type { IdentityError } from "@usepreface/protocol";

export class DomainDns extends Context.Service<
  DomainDns,
  {
    readonly resolveTxt: (name: string) => Effect.Effect<readonly string[], IdentityError>;
  }
>()("@usepreface/application/organization/domain/DomainDns") {}
