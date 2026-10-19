import { PublicTeam } from "@usepreface/protocol/dto";

import { currentOrganization, onboardOwner } from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test.use({ dashboardUI: true });

test("team settings cancel edits and preserve a concurrent change to an untouched field", async ({
  page,
  backend,
  api,
  mailbox,
}) => {
  await onboardOwner(api, backend, mailbox);
  await currentOrganization(api);
  const path = `/organization/teams`;
  const team = await api.json(
    PublicTeam,
    path,
    "POST",
    {
      slug: "support",
      metadata: { name: "Support", description: "Original description" },
    },
    201,
  );

  await page.goto(`${backend.dashboard}/settings/teams/${team.id}`);
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  const name = page.getByLabel("Name", { exact: true });
  const description = page.getByLabel("Description", { exact: true });
  await name.fill("Discarded name");
  await description.fill("Discarded description");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(name).toHaveValue("Support");
  await expect(description).toHaveValue("Original description");

  await api.json(PublicTeam, `${path}/${team.id}`, "PATCH", {
    metadata: { description: "Changed by another administrator" },
  });
  await name.fill("Customer Support");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Team details saved", { exact: true })).toBeVisible();

  const updated = await api.json(PublicTeam, `${path}/${team.id}`);
  expect(updated.metadata.name).toBe("Customer Support");
  expect(updated.metadata.description).toBe("Changed by another administrator");
  await page.reload();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  await expect(description).toHaveValue("Changed by another administrator");
});
