import { createContext, Fragment, useCallback, useContext, useState, type ReactNode } from "react";

import { RegistryContext } from "@effect/atom-react";
import type { AtomRegistry } from "effect/reactivity";

const AuthorityResetContext = createContext<(() => void) | null>(null);

export function RegistryProvider({
  registry,
  children,
}: {
  registry: AtomRegistry.AtomRegistry;
  children: ReactNode;
}) {
  const [generation, setGeneration] = useState(0);
  const reset = useCallback(() => {
    registry.reset();
    setGeneration((previous) => previous + 1);
  }, [registry]);
  // Registry.reset destroys subscriptions. Remount all consumers to subscribe to the new nodes.
  return (
    <RegistryContext.Provider value={registry}>
      <AuthorityResetContext.Provider value={reset}>
        <Fragment key={generation}>{children}</Fragment>
      </AuthorityResetContext.Provider>
    </RegistryContext.Provider>
  );
}
export function useResetAuthority() {
  const reset = useContext(AuthorityResetContext);
  if (!reset) throw new Error("Authority reset context is missing");
  return reset;
}
