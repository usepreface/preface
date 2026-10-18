import { useContext, useEffect } from "react";

import { RegistryContext, useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, type Atom } from "effect/reactivity";

import { sessionAtom } from "#/atoms/session";
import { errorCode, isAccessRejection } from "#/lib/api-errors";

import { observeQueryFocus } from "./query-focus";

export const toQuery = <Args extends readonly unknown[], A, E>(
  getAtom: (...args: Args) => Atom.Atom<AsyncResult.AsyncResult<A, E>>,
) =>
  function useQuery(...args: Args) {
    const atom = getAtom(...args);
    const result = useAtomValue(atom);
    const refetch = useAtomRefresh(atom);
    const registry = useContext(RegistryContext);
    useEffect(() => observeQueryFocus(registry, atom), [registry, atom]);
    const error = Option.getOrNull(AsyncResult.error(result));

    useEffect(() => {
      if (errorCode(error) === "UNAUTHENTICATED") registry.refresh(sessionAtom);
    }, [error, registry]);

    return {
      data: isAccessRejection(error) ? undefined : Option.getOrUndefined(AsyncResult.value(result)),
      error,
      cause: AsyncResult.isFailure(result) ? result.cause : null,
      isPending: AsyncResult.isInitial(result),
      isFetching: result.waiting,
      isError: AsyncResult.isFailure(result),
      refetch,
    };
  };
