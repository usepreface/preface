import { toast } from "@usepreface/ui/components/sonner";

/*
 * Toast copy for the actions the dashboard can take. Screens call these instead of writing their
 * own strings, so the same action always reads the same way. API failures are mapped separately.
 */
export const feedback = {
  saved: (what: string) => toast.success(`${what} saved`),
  sent: (title: string, description?: string) => toast.success(title, { description }),
  copied: (what: string) => toast.success(`${what} copied`),
  done: (title: string, description?: string) => toast.success(title, { description }),
};
