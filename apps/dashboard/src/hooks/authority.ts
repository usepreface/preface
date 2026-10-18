import { useLayoutEffect, useRef } from "react";

import { useRouter } from "@tanstack/react-router";

import { useResetAuthority } from "#/components/api/registry-provider";

export function useAuthorityReset(fingerprint: string | undefined): boolean {
  const reset = useResetAuthority();
  const router = useRouter();
  const previous = useRef(fingerprint);
  const changed =
    fingerprint !== undefined && previous.current !== undefined && fingerprint !== previous.current;
  useLayoutEffect(() => {
    if (!changed) {
      if (fingerprint !== undefined) previous.current = fingerprint;
      return;
    }
    previous.current = fingerprint;
    reset();
    void router.invalidate();
  }, [changed, fingerprint, reset, router]);
  return changed;
}
