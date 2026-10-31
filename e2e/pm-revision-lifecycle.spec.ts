import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function scanAccessibility(page: Page, screen: string) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations, `axe violations on ${screen}`).toEqual([]);
}

function watchRuntime(page: Page) {
  const failures: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 500) failures.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  return failures;
}

async function openPlannerEditor(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Start with one piece of equipment" })).toBeVisible();
  await page.getByRole("button", { name: "Start an analysis" }).click();
  await page.getByLabel("Equipment name").fill("QA ONLY - Revision lifecycle sample");
  await page.getByLabel("Information you are supplying as the planner").fill("Synthetic QA context only; no real equipment or operational instructions.");
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
}

test("F03: approved PM revisions preserve history and require a change summary", async ({ page }) => {
  const failures = watchRuntime(page);
  await openPlannerEditor(page);
  await page.getByLabel("PM title").fill("QA ONLY - Revision history test");
  await page.getByRole("textbox", { name: "Frequency" }).fill("Not established in synthetic QA");
  await page.getByLabel("Estimated duration (minutes)").fill("10");
  await page.getByLabel("Operating state", { exact: true }).selectOption("stopped");
  await page.getByLabel("Safety precautions / LOTO details").fill("Synthetic placeholder; no real work instructions.");
  await page.getByRole("button", { name: "Add task step" }).click();
  await page.getByLabel("Task step 1", { exact: true }).fill("QA-only placeholder step; do not perform maintenance work.");
  await page.getByLabel("Final verification content").fill("Confirm the record remains labeled QA ONLY.");
  await page.getByRole("checkbox", {
    name: "I reviewed this planner-authored PM, including the asset, frequency, duration, operating state, safety details, task steps, and any unresolved limitations.",
  }).check();
  await scanAccessibility(page, "initial PM before approval");

  await page.getByRole("button", { name: "Approve PM" }).click();
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();
  await expect(page.getByText(/It is the initial approved version/)).toBeVisible();
  await scanAccessibility(page, "initial approved PM");

  await page.getByRole("button", { name: "Start new revision" }).click();
  await expect(page.getByLabel("Revision summary")).toBeVisible();
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();
  await page.getByLabel("Revision summary").fill("Clarified a QA-only placeholder step.");
  await page.getByRole("textbox", { name: "Frequency" }).fill("Not established in synthetic QA; revision 1");
  await page.getByLabel("Task step 1", { exact: true }).fill("Revision 1 QA placeholder; do not perform maintenance work.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toHaveText("PM draft saved and read back.");

  await page.reload();
  await expect(page.getByLabel("Revision summary")).toHaveValue("Clarified a QA-only placeholder step.");
  await expect(page.getByLabel("Task step 1", { exact: true })).toHaveValue("Revision 1 QA placeholder; do not perform maintenance work.");
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();
  await scanAccessibility(page, "reloaded revision draft");

  await page.getByRole("checkbox", {
    name: "I reviewed this planner-authored PM, including the asset, frequency, duration, operating state, safety details, task steps, and any unresolved limitations.",
  }).check();
  await page.getByLabel("Revision summary").fill("");
  await page.getByRole("button", { name: "Approve PM" }).click();
  const validation = page.getByRole("alert").filter({ hasText: "Approval needs attention" });
  await expect(validation).toContainText("Summarize the changes in this PM revision before approval.");
  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();
  await scanAccessibility(page, "revision approval rejected without summary");

  await page.getByLabel("Revision summary").fill("Clarified a QA-only placeholder step.");
  await page.getByRole("button", { name: "Approve PM" }).click();
  await expect(page.getByText("Revision 1", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Clarified a QA-only placeholder step.", { exact: true })).toBeVisible();
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();
  await scanAccessibility(page, "revision 1 approved with history");

  expect(failures, "unexpected browser runtime failures").toEqual([]);
});
