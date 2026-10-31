import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

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

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
}

async function scanAccessibility(page: Page, screen: string) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations, `axe violations on ${screen}`).toEqual([]);
}

test("F02-E1: disabled manual intake stays usable at mobile and desktop widths", async ({ page }) => {
  const failures = watchRuntime(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Start with one piece of equipment" })).toBeVisible();
  await page.getByRole("button", { name: "Start an analysis" }).press("Enter");
  await page.getByLabel("Equipment name").fill("QA ONLY - Manual intake viewport");
  await page.getByLabel("Information you are supplying as the planner").fill("Synthetic layout review only.");
  await page.getByRole("button", { name: "Save and review information" }).press("Enter");

  await expect(page.getByRole("heading", { name: "Review the information and its limits" })).toBeVisible();
  await expect(page.getByText("New uploads are disabled.")).toBeVisible();
  await expect(page.getByLabel("Choose a manual to extract locally")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await scanAccessibility(page, "manual intake at mobile width");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.getByText("New uploads are disabled.")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await scanAccessibility(page, "manual intake at desktop width");
  expect(failures, "unexpected browser runtime failures").toEqual([]);
});
