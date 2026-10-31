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
  await page.getByLabel("Equipment name").fill("QA ONLY - field citation sample");
  await page.getByLabel("Information you are supplying as the planner").fill("Synthetic QA context; no real equipment instructions.");
  await page.getByRole("button", { name: "Save and review information" }).click();
  await page.getByLabel("Reference label").fill("Synthetic QA source");
  await page.getByLabel("Reference location").fill("QA-only planner note");
  await page.getByLabel("Applicability to this equipment").selectOption("applicable");
  await page.getByLabel("Applicability details").fill("Applies only to synthetic QA content.");
  await page.getByRole("checkbox", { name: "I reviewed the available information and limitations and want to continue. Missing or unreadable manual text is not treated as evidence." }).check();
  await page.getByRole("button", { name: "Continue to asset proposal" }).click();
  await page.getByRole("checkbox", { name: "Confirm this equipment asset" }).check();
  await page.getByRole("button", { name: "Save assets and write PM" }).click();
  await expect(page.getByRole("heading", { name: "Write and review the maintenance plan" })).toBeVisible();
  await page.getByLabel("PM title").fill("QA ONLY - field citation sample");
  await page.getByRole("textbox", { name: "Frequency" }).fill("Not established in synthetic QA");
  await page.getByLabel("Estimated duration (minutes)").fill("5");
  await page.getByLabel("Operating state", { exact: true }).selectOption("stopped");
  await page.getByLabel("Safety precautions / LOTO details").fill("Synthetic placeholder; no real work instructions.");
  await page.getByLabel("Final verification content").fill("Confirm the synthetic record remains QA ONLY.");
}

test("F05: field citations stay attached to their PM fields through edits, reload, copy preview, and approval history", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") runtimeErrors.push(message.text()); });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await openPmEditor(page);

  const frequencyEvidence = page.getByRole("region", { name: "Evidence for frequency" });
  await frequencyEvidence.getByRole("button", { name: "Add citation" }).click();
  const frequencyLocator = frequencyEvidence.getByLabel("Specific location (optional)");
  await frequencyLocator.fill("QA-only planner note, frequency line");
  await frequencyLocator.fill("QA-only planner note, frequency field");
  await frequencyEvidence.getByRole("button", { name: "Remove citation 1 for frequency" }).click();
  await expect(frequencyEvidence.getByText("No field citation attached.")).toBeVisible();
  await frequencyEvidence.getByRole("button", { name: "Add citation" }).click();
  await frequencyEvidence.getByLabel("Specific location (optional)").fill("QA-only planner note, frequency line");

  await page.getByRole("button", { name: "Add task step" }).click();
  await page.getByRole("button", { name: "Add task step" }).click();
  await page.getByLabel("Task step 1", { exact: true }).fill("QA-only planner action one; not an instruction to perform work.");
  await page.getByLabel("Task step 2", { exact: true }).fill("QA-only planner action two; not an instruction to perform work.");
  const firstStepEvidence = page.getByRole("region", { name: "Evidence for task step 1" });
  const secondStepEvidence = page.getByRole("region", { name: "Evidence for task step 2" });
  await firstStepEvidence.getByRole("button", { name: "Add citation" }).click();
  await firstStepEvidence.getByLabel("Specific location (optional)").fill("QA-only action one");
  await secondStepEvidence.getByRole("button", { name: "Add citation" }).click();
  await secondStepEvidence.getByLabel("Specific location (optional)").fill("QA-only action two");

  await page.getByRole("button", { name: "Remove task step 1" }).click();
  const reindexedEvidence = page.getByRole("region", { name: "Evidence for task step 1" });
  await expect(reindexedEvidence.getByLabel("Specific location (optional)")).toHaveValue("QA-only action two");
  await expect(page.getByLabel("Task step 1", { exact: true })).toHaveValue("QA-only planner action two; not an instruction to perform work.");

  const preview = page.getByRole("region", { name: "PM handoff preview" });
  await expect(preview).toContainText("Evidence for frequency: Synthetic QA source · QA-only planner note, frequency line");
  await expect(preview).toContainText("Evidence for task step 1: Synthetic QA source · QA-only action two");
  await scanAccessibility(page, "PM field citations before save");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "replica/clone-screens/S05-field-citations-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(mobileOverflow, "PM field citations should not overflow horizontally at 390 CSS px").toBe(false);
  await page.screenshot({ path: "replica/clone-screens/S05-field-citations-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toHaveText("PM draft saved and read back.");
  await page.reload();
  await expect(page.getByRole("region", { name: "Evidence for frequency" }).getByLabel("Specific location (optional)")).toHaveValue("QA-only planner note, frequency line");
  await expect(page.getByRole("region", { name: "Evidence for task step 1" }).getByLabel("Specific location (optional)")).toHaveValue("QA-only action two");
  await expect(page.getByRole("region", { name: "PM handoff preview" })).toContainText("Evidence for task step 1: Synthetic QA source · QA-only action two");

  await page.getByRole("checkbox", { name: "I reviewed this planner-authored PM, including the asset, frequency, duration, operating state, safety details, task steps, and any unresolved limitations." }).check();
  await page.getByRole("button", { name: "Approve PM" }).click();
  await expect(page.getByText("Initial approved version", { exact: true })).toBeVisible();
  await page.getByText("View approved snapshot", { exact: true }).click();
  await expect(page.locator("details pre")).toContainText("Evidence for frequency: Synthetic QA source · QA-only planner note, frequency line");
  await expect(page.locator("details pre")).toContainText("Evidence for task step 1: Synthetic QA source · QA-only action two");
  await scanAccessibility(page, "approved PM field citation snapshot");
  expect(runtimeErrors, "field citation flow should not produce browser runtime errors").toEqual([]);
});
