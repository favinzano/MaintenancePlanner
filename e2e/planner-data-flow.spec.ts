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

async function openPlannerEditor(page: Page, name = "QA ONLY - Pump 001") {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Start with one piece of equipment" })).toBeVisible();
  await scanAccessibility(page, "workspace");
  await page.getByRole("button", { name: "Start an analysis" }).click();
  await expect(page.getByRole("heading", { name: "Equipment and planner details" })).toBeVisible();
  await scanAccessibility(page, "intake");
  await page.getByLabel("Equipment name").fill(name);
  await page.getByLabel("Information you are supplying as the planner").fill("Synthetic QA context only. No real equipment instructions.");
  await page.getByRole("button", { name: "Save and review information" }).click();
  await expect(page.getByRole("heading", { name: "Review the information and its limits" })).toBeVisible();
  await scanAccessibility(page, "evidence review");
  await page.getByLabel("Reference label").fill("Synthetic planner notes");
  await page.getByLabel("Reference location").fill("QA-only note 1");
  await page.getByLabel("Applicability to this equipment").selectOption("applicable");
  await page.getByLabel("Applicability details").fill("Applies only to synthetic test data.");
  await page.getByLabel("Additional limitations (one per line)").fill("Synthetic content; not a maintenance instruction.");
  await page.getByLabel("I have reviewed these limitations and want to continue using only the planner-provided information.").check();
  await page.getByRole("button", { name: "Continue to asset proposal" }).click();
  await expect(page.getByRole("heading", { name: "Select the assets to keep" })).toBeVisible();
  await scanAccessibility(page, "asset proposal");
  await page.getByRole("checkbox", { name: "Confirm this equipment asset" }).check();
  await page.getByRole("button", { name: "Save assets and write PM" }).click();
  await expect(page.getByRole("heading", { name: "Write and review the maintenance plan" })).toBeVisible();
}

test("F01-A1: planner can trace a reviewed source into a saved PM draft", async ({ page }) => {
  const failures = watchRuntime(page);
  await openPlannerEditor(page);
  await scanAccessibility(page, "PM editor");

  await page.getByLabel("PM title").fill("QA ONLY - Routine synthetic inspection");
  await page.getByRole("textbox", { name: "Frequency" }).fill("Not established in synthetic QA");
  await page.getByLabel("Estimated duration (minutes)").fill("10");
  await page.getByLabel("Safety precautions / LOTO details").fill("Synthetic placeholder; consult approved site procedures.");
  await page.getByRole("button", { name: "Add task step" }).click();
  await page.getByLabel("Task step 1", { exact: true }).fill("Record the synthetic QA result.");
  await page.getByLabel("Final verification content").fill("Record the synthetic outcome.");
  await expect(page.getByRole("checkbox", { name: "Include the reviewed planner-provided source in this PM." })).toBeChecked();
  await expect(page.getByText("Synthetic planner notes", { exact: true })).toBeVisible();
  await expect(page.getByText("Synthetic content; not a maintenance instruction.", { exact: true })).toBeVisible();
  await expect(page.locator("pre")).toContainText("Evidence references");

  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toHaveText("PM draft saved and read back.");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Write and review the maintenance plan" })).toBeVisible();
  await expect(page.getByText("QA ONLY - Routine synthetic inspection", { exact: true })).toBeVisible();
  await expect(page.locator("pre")).toContainText("Synthetic planner notes");
  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
  await scanAccessibility(page, "reloaded PM draft");

  expect(failures, "unexpected browser runtime failures").toEqual([]);
});

test("F01-A2: required intake fields block an empty submission", async ({ page }) => {
  const failures = watchRuntime(page);
  await page.goto("/");
  await scanAccessibility(page, "workspace");
  await page.getByRole("button", { name: "Start an analysis" }).click();
  const equipmentName = page.getByLabel("Equipment name");
  await page.getByRole("button", { name: "Save and review information" }).click();
  await expect(equipmentName).toBeFocused();
  await expect.poll(() => equipmentName.evaluate((element) => (element as HTMLInputElement).validity.valueMissing)).toBe(true);
  await scanAccessibility(page, "intake validation");
  expect(failures, "unexpected browser runtime failures").toEqual([]);
});

test("F01-A3: incomplete PM approval is rejected and remains a draft", async ({ page }) => {
  const failures = watchRuntime(page);
  await openPlannerEditor(page, "QA ONLY - Approval guard");
  await scanAccessibility(page, "PM editor before approval");
  await page.getByRole("button", { name: "Approve PM" }).click();
  const alert = page.getByRole("alert").filter({ hasText: "Approval needs attention" });
  await expect(alert).toContainText("Approval needs attention");
  await expect(alert).toContainText("Confirm that you reviewed this planner-authored PM.");
  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /QA ONLY - Approval guard.*PM draft/ }).click();
  await expect(page.getByRole("heading", { name: "Write and review the maintenance plan" })).toBeVisible();
  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
  await scanAccessibility(page, "draft after rejected approval");
  expect(failures, "unexpected browser runtime failures").toEqual([]);
});
