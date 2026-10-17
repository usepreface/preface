import * as React from "react";

import { useReducedMotion } from "../../../../hooks/use-reduced-motion";

const QUERY = "rotate keys";

export function useTypedQuery(active: boolean) {
  const [value, setValue] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const reduced = useReducedMotion();
  React.useEffect(() => {
    if (!active || touched) {
      return;
    }
    if (reduced) {
      setValue(QUERY);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setValue(QUERY.slice(0, i));
      if (i >= QUERY.length) {
        window.clearInterval(id);
      }
    }, 85);
    return () => window.clearInterval(id);
  }, [active, touched, reduced]);
  return {
    value,
    onValueChange: (next: string) => {
      setTouched(true);
      setValue(next);
    },
  };
}
