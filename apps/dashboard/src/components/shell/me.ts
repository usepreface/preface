import { placeholder } from "#/lib/placeholder";

import type { Person } from "./account-menu";

/** The signed-in person. Comes from the session once auth is wired. */
export const me: Person & { instanceOwner: boolean } = {
  name: placeholder.owner.name,
  email: placeholder.owner.email,
  instanceOwner: true,
};
