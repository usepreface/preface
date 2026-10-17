import { Clock, Context, Effect, Layer, Semaphore } from "effect";

const ratePolicies = { global: 240, inspect: 30, complete: 10, issue: 5 } as const;
type Bucket = keyof typeof ratePolicies;

const makeRequestLimits = Effect.gen(function* () {
  const setup = yield* Semaphore.make(2);
  const windows = new Map<string, { count: number; readonly expiresAt: number }>();
  let nextSweep = 0;

  const check = Effect.fnUntraced(function* (bucket: Bucket, address: string) {
    const now = yield* Clock.currentTimeMillis;
    if (now >= nextSweep) {
      for (const [key, window] of windows) {
        if (window.expiresAt <= now) windows.delete(key);
      }
      nextSweep = now + 60_000;
    }
    const key = `${bucket}:${address}`;
    const current = windows.get(key);
    if (current !== undefined && current.expiresAt > now) {
      if (current.count >= ratePolicies[bucket])
        return Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
      current.count++;
      return undefined;
    }
    // Never evict an active window to admit a new address: that would reset its limit.
    if (windows.size >= 10_000) return 60;
    windows.set(key, { count: 1, expiresAt: now + 60_000 });
    return undefined;
  });

  return { check, runSetup: setup.withPermitsIfAvailable(1) } as const;
});

export class RequestLimits extends Context.Service<
  RequestLimits,
  Effect.Success<typeof makeRequestLimits>
>()("@usepreface/server/http/RequestLimits") {
  static readonly layer = Layer.effect(RequestLimits, makeRequestLimits);
}
