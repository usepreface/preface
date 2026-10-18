import type { Atom, AtomRegistry } from "effect/reactivity";

type FocusSubscription = {
  readonly queries: Map<Atom.Atom<unknown>, number>;
  readonly refresh: () => void;
};
const subscriptions = new WeakMap<AtomRegistry.AtomRegistry, FocusSubscription>();

// Several components can read the same atom. Refresh it once per focus event, not once per hook.
export function observeQueryFocus(registry: AtomRegistry.AtomRegistry, atom: Atom.Atom<unknown>) {
  let subscription = subscriptions.get(registry);
  if (!subscription) {
    const queries = new Map<Atom.Atom<unknown>, number>();
    const refresh = () => {
      if (document.visibilityState === "visible")
        for (const query of queries.keys()) registry.refresh(query);
    };
    subscription = { queries, refresh };
    subscriptions.set(registry, subscription);
    window.addEventListener("focus", refresh);
  }
  const current = subscription;
  current.queries.set(atom, (current.queries.get(atom) ?? 0) + 1);
  return () => {
    const readers = (current.queries.get(atom) ?? 1) - 1;
    if (readers === 0) current.queries.delete(atom);
    else current.queries.set(atom, readers);
    if (current.queries.size === 0) {
      window.removeEventListener("focus", current.refresh);
      subscriptions.delete(registry);
    }
  };
}
