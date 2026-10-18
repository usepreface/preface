import { toast } from "@usepreface/ui/components/sonner";

/*
 * Toast copy for the actions the dashboard can take. Screens call these instead of writing their
 * own strings, so the same action always reads the same way. When mutations are wired up, map
 * their errors here too.
 */
export const feedback = {
  saved: (what: string) => toast.success(`${what} saved`),
  sent: (title: string, description?: string) => toast.success(title, { description }),
  copied: (what: string) => toast.success(`${what} copied`),
  done: (title: string, description?: string) => toast.success(title, { description }),
  notConnected: () =>
    toast.info("Not connected yet", {
      description: "This screen is a preview. It isn’t connected to the API yet.",
    }),
};
