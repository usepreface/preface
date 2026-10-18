import type { ReactNode } from "react";

import { Button } from "@usepreface/ui/components/button";

import { Notice } from "#/components/feedback/notice";
import { apiErrorMessage } from "#/lib/api-errors";

import { QueryLoading } from "./query-loading";

export function QueryState({
  query,
  children,
}: {
  query: {
    data: unknown;
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => void;
  };
  children: ReactNode;
}) {
  if (query.isPending) return <QueryLoading className="p-0" />;
  if (query.isError)
    return (
      <Notice tone="warning" title="Couldn’t load this page">
        <p>{apiErrorMessage(query.error)}</p>
        <Button variant="outline" onClick={query.refetch}>
          Try again
        </Button>
      </Notice>
    );
  return children;
}
