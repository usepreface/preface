import { useCallback, useEffect, useMemo, useRef } from "react";

import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Cause, Exit } from "effect";
import { Atom } from "effect/reactivity";

import { showApiError } from "#/lib/api-errors";

type Arguments<I> = undefined extends I ? [input?: I] : [input: I];

export const toMutation = <I, A, E>(createAtom: () => Atom.AtomResultFn<I, A, E>) =>
  function useMutation() {
    const atom = useMemo(createAtom, []);
    const result = useAtomValue(atom);
    const reset = useAtomSet(atom);
    const set = useAtomSet(atom, { mode: "promiseExit" });
    const active = useRef(true);
    const busy = useRef(false);
    useEffect(() => {
      active.current = true;
      return () => {
        active.current = false;
      };
    }, []);

    const run = useCallback(
      async (...args: Arguments<I>): Promise<{ readonly value: A } | undefined> => {
        if (busy.current) return undefined;
        busy.current = true;
        try {
          const exit = await set(args[0] as I);
          if (!active.current) return undefined;
          if (Exit.isFailure(exit)) {
            showApiError(Cause.squash(exit.cause));
            return undefined;
          }
          return { value: exit.value };
        } finally {
          busy.current = false;
          if (active.current) reset(Atom.Reset);
        }
      },
      [set, reset],
    );

    return { run, pending: result.waiting };
  };
