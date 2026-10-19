export const QueryKeys = {
  authority: "authority:current",
  instance: "instance:configuration",
  account: "account:current",
  organization: "organization:current",
  team: (id: string) => `team:${id}`,
  connection: (id: string) => `connection:${id}`,
} as const;
