import * as React from "react";

/** Copies text and reports `copied` for `timeout` ms, for "Copied" feedback on buttons. */
export function useCopyToClipboard({ timeout = 2000 }: { timeout?: number } = {}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const copy = React.useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        return false;
      }
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), timeout);
      return true;
    },
    [timeout],
  );

  return { copied, copy };
}
