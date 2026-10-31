import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function scanAccessibility(page: Page, screen: string) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations, `axe violations on ${screen}`).toEqual([]);
}

async function openPmEditor(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Start with one piece of equipment" })).toBeVisible();
  await page.getByRole("button", { name: "Start an analysis" }).click();
  await page.getByLabel("Equipment name").fill("QA ONLY - PM split sample");
  await page.getByLabel("Information you are supplying as the planner").fill("Synthetic QA context only; no real equipment or operating instructions.");
  await page.getByRole("button", { name: "Save and review information" }).click();
  await page.getByLabel("Reference label").fill("Synthetic QA source");
  await page.getByLabel("Reference location").fill("QA-only note");
  await page.getByLabel("Applicability to this equipment").selectOption("applicable");
  await page.getByLabel("Applicability details").fill("Applies only to synthetic test content.");
  await page.getByLabel("I reviewed the available information and limitations and want to continue. Missing or unreadable manual text is not treated as evidence.").check();
  await page.getByRole("button", { name: "Continue to asset proposal" }).click();
  await page.getByRole("checkbox", { name: "Confirm this equipment asset" }).check();
  await page.getByRole("button", { name: "Save assets and write PM" }).click();
  await expect(page.getByRole("heading", { name: "Write and review the maintenance plan" })).toBeVisible();
  await page.getByLabel("PM title").fill("QA ONLY - PM split sample");
  await page.getByRole("textbox", { name: "Frequency" }).fill("Not established in synthetic QA");
  await page.getByLabel("Estimated duration (minutes)").fill("10");
  await page.getByLabel("Operating state", { exact: true }).selectOption("stopped");
  await page.getByLabel("Safety precautions / LOTO details").fill("Synthetic placeholder; no real work instructions.");
  await page.getByLabel("Final verification content").fill("Confirm the record remains labeled QA ONLY.");
  for (let index = 0; index < 13; index += 1) {
    await page.getByRole("button", { name: "Add task step" }).click();
  }
  for (let index = 0; index < 13; index += 1) {
    await page.getByLabel(`Task step ${index + 1}`, { exact: true }).fill(`QA-only placeholder action ${index + 1}; do not perform maintenance work.`);
  }
  await expect(page.getByText(/15 of 15 steps/)).toBeVisible();
}

test("F04: cancelling or exceeding the cap leaves a full PM draft unchanged", async ({ page }) => {
  await openPmEditor(page);
  await page.getByRole("button", { name: "Propose PM split" }).click();
  await page.getByLabel("Additional actions for the continuation PM").fill("QA-only overflow action 1.\nQA-only overflow action 2.");
  await page.getByLabel("PM 1 keeps task steps through").selectOption("1");
  await expect(page.getByText(/Each resulting PM must have 15 steps or fewer/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm split and save drafts" })).toBeDisabled();
  await scanAccessibility(page, "invalid over-limit PM split proposal");

  await page.getByLabel("PM 1 keeps task steps through").selectOption("6");
  await expect(page.getByText("PM 1 · 8 / 15 steps")).toBeVisible();
  await expect(page.getByText("PM 2 · 11 / 15 steps")).toBeVisible();
  await page.getByRole("button", { name: "Cancel proposal" }).click();
  await expect(page.getByRole("button", { name: "Propose PM split" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Maintenance plan" })).toHaveCount(0);
  await expect(page.getByLabel("Task step 13", { exact: true })).toHaveValue("QA-only placeholder action 13; do not perform maintenance work.");
});

test("F04: planner-confirmed split creates two persistent editable PM drafts", async ({ page }) => {
  await openPmEditor(page);
  await page.getByRole("button", { name: "Propose PM split" }).click();
  await page.getByLabel("Additional actions for the continuation PM").fill("QA-only overflow action one.\nQA-only overflow action two.");
  await page.getByLabel("PM 1 keeps task steps through").selectOption("6");
  await expect(page.getByText("PM 1 · 8 / 15 steps")).toBeVisible();
  await expect(page.getByText("PM 2 · 11 / 15 steps")).toBeVisible();
  await scanAccessibility(page, "valid PM split proposal");

  const splitProposal = page.getByRole("heading", { name: "PM split proposal" }).locator("xpath=../../..");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await splitProposal.screenshot({
    path: "replica/clone-screens/S06-pm-split-proposal-desktop.png",
    style: "header { position: static !important; }",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(mobileOverflow, "PM split proposal should not overflow horizontally at 390 CSS px").toBe(false);
  await splitProposal.screenshot({
    path: "replica/clone-screens/S06-pm-split-proposal-mobile.png",
    style: "header { position: static !important; }",
  });
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.getByRole("button", { name: "Confirm split and save drafts" }).click();
  await expect(page.getByRole("status")).toHaveText("PM split confirmed. Both drafts were saved and read back.");
  await expect(page.getByLabel("Maintenance plan")).toHaveValue(/.+/);
  await expect(page.locator("textarea[id^='task-step-']")).toHaveCount(6);

  const plans = page.getByLabel("Maintenance plan");
  await plans.selectOption({ index: 1 });
  await expect(page.getByText(/11 of 15 steps/)).toBeVisible();
  await expect(page.locator("textarea[id^='task-step-']")).toHaveCount(9);
  await expect(page.getByLabel("Task step 8", { exact: true })).toHaveValue("QA-only overflow action one.");
  await expect(page.getByLabel("Task step 9", { exact: true })).toHaveValue("QA-only overflow action two.");
  await page.getByLabel("Task step 1", { exact: true }).fill("Edited QA continuation action; still not a work instruction.");
  await plans.selectOption({ index: 0 });
  await expect(page.getByLabel("Task step 1", { exact: true })).toHaveValue("QA-only placeholder action 1; do not perform maintenance work.");
  await plans.selectOption({ index: 1 });
  await expect(page.getByLabel("Task step 1", { exact: true })).toHaveValue("Edited QA continuation action; still not a work instruction.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toHaveText("PM draft saved and read back.");
  await page.reload();
  await expect(page.getByLabel("Maintenance plan")).toBeVisible();
  await page.getByLabel("Maintenance plan").selectOption({ index: 1 });
  await expect(page.getByLabel("Task step 1", { exact: true })).toHaveValue("Edited QA continuation action; still not a work instruction.");
  await expect(page.getByLabel("Task step 9", { exact: true })).toHaveValue("QA-only overflow action two.");
  await scanAccessibility(page, "reloaded continuation PM draft");

  await page.getByRole("checkbox", {
    name: "I reviewed this planner-authored PM, including the asset, frequency, duration, operating state, safety details, task steps, and any unresolved limitations.",
  }).check();
  await page.getByRole("button", { name: "Approve PM" }).click();
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();
  await scanAccessibility(page, "continuation PM independently approved");

  await page.getByLabel("Maintenance plan").selectOption({ index: 0 });
  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Approved revision history" })).toHaveCount(0);
  await page.getByRole("checkbox", {
    name: "I reviewed this planner-authored PM, including the asset, frequency, duration, operating state, safety details, task steps, and any unresolved limitations.",
  }).check();
  await page.getByRole("button", { name: "Approve PM" }).click();
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();
  await page.getByLabel("Maintenance plan").selectOption({ index: 1 });
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();
  await scanAccessibility(page, "both PMs retain independent approval histories");
});
