import { Context, Effect, Layer, Ref } from "effect";

import { DomainDns } from "../../src/index.js";

export class TestDomainDns extends Context.Service<
  TestDomainDns,
  {
    readonly records: Ref.Ref<readonly string[]>;
  }
>()("TestDomainDns") {
  static readonly layer = Layer.effect(
    TestDomainDns,
    Effect.gen(function* () {
      return { records: yield* Ref.make<readonly string[]>([]) };
    }),
  );
}

export const DomainDnsTestLayer = Layer.effect(
  DomainDns,
  Effect.gen(function* () {
    const test = yield* TestDomainDns;
    return { resolveTxt: () => Ref.get(test.records) };
  }),
).pipe(Layer.provideMerge(TestDomainDns.layer));
