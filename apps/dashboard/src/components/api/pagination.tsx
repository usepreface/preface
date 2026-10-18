import { Button } from "@usepreface/ui/components/button";
export function Pagination<C extends string>({
  cursor,
  nextCursor,
  onChange,
  pending,
}: {
  cursor?: C;
  nextCursor?: C | null;
  onChange: (cursor?: C) => void;
  pending?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {cursor ? (
        <Button variant="outline" disabled={pending} onClick={() => onChange(undefined)}>
          First page
        </Button>
      ) : null}
      {nextCursor ? (
        <Button variant="outline" disabled={pending} onClick={() => onChange(nextCursor)}>
          Next page
        </Button>
      ) : null}
    </div>
  );
}
