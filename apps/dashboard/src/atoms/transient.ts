import { Atom, type AtomRegistry } from "effect/reactivity";

import type { BootstrapVerification, EmailSignInChallenge } from "@usepreface/protocol/dto";

// One-time proofs live only for this document. Reloading requires reopening the original link.
const fragment = new URLSearchParams(window.location.hash.slice(1));
export const linkProof = Object.fromEntries(fragment);
if (fragment.has("token") || fragment.has("proofToken"))
  window.history.replaceState(null, "", window.location.pathname + window.location.search);

export const setupAtom = Atom.make<{
  token: string;
  email: string;
  challenge?: BootstrapVerification;
}>({ token: "", email: "" }).pipe(Atom.keepAlive);
export const signInAtom = Atom.make<{ email: string; challenge?: EmailSignInChallenge }>({
  email: "",
}).pipe(Atom.keepAlive);

export function initializeSetupProof(registry: AtomRegistry.AtomRegistry) {
  if (window.location.pathname === "/setup" || window.location.pathname === "/setup/") {
    if (linkProof.token) registry.set(setupAtom, { token: linkProof.token, email: "" });
    delete linkProof.token;
  }
}

fragment.forEach((value, key) => fragment.set(key, ""));
