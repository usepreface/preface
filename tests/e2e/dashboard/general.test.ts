import { OrganizationDetail, PublicOrganization } from "@usepreface/protocol/dto";

import { currentOrganization, onboardOwner } from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test.use({ dashboardUI: true });

test("organization settings cancel edits, preserve untouched fields after renaming", async ({
  page,
  backend,
  api,
  mailbox,
}) => {
  await onboardOwner(api, backend, mailbox);
  const { organization } = await currentOrganization(api);
  const path = `/organization`;

  await page.goto(`${backend.dashboard}/settings/general`);
  const details = page.getByRole("form", { name: "Organization details" });
  const name = details.getByLabel("Name", { exact: true });
  const description = details.getByLabel("Description", { exact: true });
  const save = details.getByRole("button", { name: "Save changes", exact: true });
  await expect(save).toBeDisabled();
  await expect(details.getByText("FC", { exact: true })).toBeVisible();

  await name.fill("Unsaved company");
  await description.fill("Discard this description");
  await details.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(name).toHaveValue("Fixture Company");
  await expect(description).toHaveValue("");
  await expect(save).toBeDisabled();

  // An unrelated change made elsewhere must survive this form's partial update.
  await api.json(PublicOrganization, path, "PATCH", {
    metadata: { description: "Updated by another administrator" },
  });
  await name.fill("Knowledge Company");
  await save.click();
  await expect(page.getByText("Organization details saved", { exact: true })).toBeVisible();
  await expect(save).toBeDisabled();
  const updated = await api.json(OrganizationDetail, path);
  expect(updated.organization.metadata.name).toBe("Knowledge Company");
  expect(updated.organization.metadata.description).toBe("Updated by another administrator");

  await page.reload();
  await expect(name).toHaveValue("Knowledge Company");
  await expect(description).toHaveValue("Updated by another administrator");
  await expect(details.getByText("KC", { exact: true })).toBeVisible();
  await expect(details).toContainText(organization.id);
});

test("the sole organization retains last-owner protection and has no archival action", async ({
  page,
  backend,
  api,
  mailbox,
}) => {
  await onboardOwner(api, backend, mailbox);
  await currentOrganization(api);
  await page.goto(`${backend.dashboard}/settings/general`);

  await page.getByRole("button", { name: "Leave organization", exact: true }).click();
  const confirmation = page.getByRole("alertdialog");
  await confirmation.getByRole("button", { name: "Leave organization", exact: true }).click();
  await expect(
    page.getByText("Keep at least one active organization owner.", { exact: true }),
  ).toBeVisible();
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();

  await expect(page.getByRole("button", { name: "Archive organization", exact: true })).toHaveCount(
    0,
  );
});
