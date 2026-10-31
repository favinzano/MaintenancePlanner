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

async function openPlannerEditor(page: Page, name: string) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Start with one piece of equipment" })).toBeVisible();
  await page.getByRole("button", { name: "Start an analysis" }).click();
  await page.getByLabel("Equipment name").fill(name);
  await page.getByLabel("Information you are supplying as the planner").fill("Synthetic QA context only; no real equipment or maintenance instructions.");
  await page.getByRole("button", { name: "Save and review information" }).click();
  await page.getByLabel("Reference label").fill("Synthetic deletion QA source");
  await page.getByLabel("Reference location").fill("QA-only source note");
  await page.getByLabel("Applicability to this equipment").selectOption("applicable");
  await page.getByLabel("Applicability details").fill("Applies only to synthetic deletion QA data.");
  await page.getByRole("checkbox", { name: "I reviewed the available information and limitations and want to continue. Missing or unreadable manual text is not treated as evidence." }).check();
  await page.getByRole("button", { name: "Continue to asset proposal" }).click();
  await page.getByRole("checkbox", { name: "Confirm this equipment asset" }).check();
  await page.getByRole("button", { name: "Save assets and write PM" }).click();
  await expect(page.getByRole("heading", { name: "Write and review the maintenance plan" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("PM draft started and read back.");
}

async function completePm(page: Page, title: string) {
  await page.getByLabel("PM title").fill(title);
  await page.getByRole("textbox", { name: "Frequency" }).fill("Not established in synthetic QA");
  await page.getByLabel("Estimated duration (minutes)").fill("5");
  await page.getByLabel("Operating state", { exact: true }).selectOption("stopped");
  await page.getByLabel("Safety precautions / LOTO details").fill("Synthetic placeholder; no real work instructions.");
  await page.getByRole("button", { name: "Add task step" }).click();
  await page.getByLabel("Task step 1", { exact: true }).fill("Record the synthetic QA value; do not perform maintenance work.");
  await page.getByLabel("Final verification content").fill("Confirm the synthetic record remains QA ONLY.");
  await page.getByRole("checkbox", { name: "I reviewed this planner-authored PM, including the asset, frequency, duration, operating state, safety details, task steps, and any unresolved limitations." }).check();
}

test("F06-H1: canceling initial draft deletion changes nothing; confirmed deletion preserves the analysis", async ({ page }) => {
  const failures = watchRuntime(page);
  const analysisName = "QA ONLY - initial draft deletion";
  await openPlannerEditor(page, analysisName);
  await page.getByLabel("PM title").fill("QA ONLY - draft to delete");
  const deleteButton = page.getByRole("button", { name: "Delete draft" });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await deleteButton.click();
  let dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Delete this PM draft?" })).toBeVisible();
  await expect(dialog).toContainText("The analysis, assets, and evidence remain saved.");
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await scanAccessibility(page, "initial draft deletion confirmation on desktop");
  await page.screenshot({ path: "replica/clone-screens/S07-pm-draft-delete-desktop.png", fullPage: true });
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(deleteButton).toBeFocused();
  await expect(page.getByLabel("PM title")).toHaveValue("QA ONLY - draft to delete");

  await deleteButton.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(deleteButton).toBeFocused();
  await expect(page.getByLabel("PM title")).toHaveValue("QA ONLY - draft to delete");

  await page.setViewportSize({ width: 390, height: 844 });
  await deleteButton.focus();
  await page.keyboard.press("Enter");
  dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflows, "the deletion confirmation should fit at 390 CSS px").toBe(false);
  await scanAccessibility(page, "initial draft deletion confirmation on mobile");
  await page.screenshot({ path: "replica/clone-screens/S07-pm-draft-delete-mobile.png", fullPage: true });
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Delete draft" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("status")).toHaveText("PM draft deleted. Assets and evidence were retained.");
  await expect(page.getByRole("heading", { name: "Select the assets to keep" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Confirm this equipment asset" })).toBeChecked();
  await page.getByRole("button", { name: /Evidence/ }).click();
  await expect(page.getByLabel("Reference label")).toHaveValue("Synthetic deletion QA source");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Select the assets to keep" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Equipment asset" })).toHaveValue(analysisName);
  await expect(page.getByRole("checkbox", { name: "Confirm this equipment asset" })).toBeChecked();
  expect(failures, "unexpected browser runtime failures").toEqual([]);
});

test("F06-H2: deleting a revision draft restores its approved snapshot and history", async ({ page }) => {
  const failures = watchRuntime(page);
  await openPlannerEditor(page, "QA ONLY - revision draft deletion");
  await completePm(page, "QA ONLY - approved base version");
  await page.getByRole("button", { name: "Approve PM" }).click();
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete draft" })).toHaveCount(0);
  await scanAccessibility(page, "approved PM cannot be deleted as a draft");

  await page.getByRole("button", { name: "Start new revision" }).click();
  await page.getByLabel("Revision summary").fill("Synthetic change to discard.");
  await page.getByLabel("PM title").fill("QA ONLY - unapproved revision");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toHaveText("PM draft saved and read back.");
  await page.reload();
  await expect(page.getByLabel("PM title")).toHaveValue("QA ONLY - unapproved revision");
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Delete draft" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Discard this PM revision draft?" })).toBeVisible();
  await expect(dialog).toContainText("returns this PM to its latest approved version");
  await scanAccessibility(page, "revision draft deletion confirmation");
  await dialog.getByRole("button", { name: "Delete draft" }).click();

  await expect(page.getByRole("status")).toHaveText("PM revision draft discarded; the approved version was restored. Assets and evidence were retained.");
  await expect(page.getByLabel("PM title")).toHaveValue("QA ONLY - approved base version");
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete draft" })).toHaveCount(0);
  await page.getByText("View approved snapshot", { exact: true }).click();
  await expect(page.locator("details pre")).toContainText("QA ONLY - approved base version");
  await page.reload();
  await expect(page.getByLabel("PM title")).toHaveValue("QA ONLY - approved base version");
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();
  expect(failures, "unexpected browser runtime failures").toEqual([]);
});

test("F06-H3: a stale browser tab cannot delete a newer saved PM draft", async ({ page, context }) => {
  const failures = watchRuntime(page);
  await openPlannerEditor(page, "QA ONLY - stale draft deletion");
  const stalePage = await context.newPage();
  const staleFailures = watchRuntime(stalePage);
  await stalePage.goto("/");
  await expect(stalePage.getByLabel("PM title")).toBeVisible();

  await page.getByLabel("PM title").fill("QA ONLY - newer saved title");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toHaveText("PM draft saved and read back.");

  await stalePage.getByRole("button", { name: "Delete draft" }).click();
  const dialog = stalePage.getByRole("dialog");
  await dialog.getByRole("button", { name: "Delete draft" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(stalePage.getByRole("alert")).toContainText("changed in another tab or session");
  await expect(stalePage.getByLabel("PM title")).toHaveValue("");
  await stalePage.reload();
  await expect(stalePage.getByLabel("PM title")).toHaveValue("QA ONLY - newer saved title");
  await expect(stalePage.getByRole("button", { name: "Delete draft" })).toBeVisible();

  expect(failures, "unexpected browser runtime failures in the updated tab").toEqual([]);
  expect(staleFailures, "unexpected browser runtime failures in the stale tab").toEqual([]);
});
