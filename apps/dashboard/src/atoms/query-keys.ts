export const QueryKeys = {
  authority: "authority:current",
  instance: "instance:configuration",
  organizations: "organizations:list",
  account: "account:current",
  organization: (id: string) => `organization:${id}`,
  team: (id: string) => `team:${id}`,
  connection: (id: string) => `connection:${id}`,
} as const;
