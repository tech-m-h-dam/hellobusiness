import { expect, type Page, test } from "@playwright/test";

/**
 * Reveal the invoice preview.
 *
 * On desktop the preview sits beside the editor and is always visible; on
 * mobile it is behind an Edit/Preview toggle by design, so tests that assert on
 * the rendered document have to switch to it first.
 */
async function showPreview(page: Page, isMobile: boolean | undefined) {
  if (isMobile) await page.getByRole("button", { name: "Preview" }).click();
  return page.locator('[data-print="area"]');
}

/**
 * The critical path: a visitor arrives, fills in an invoice, sees the totals and
 * preview update, switches template, and downloads a PDF — without an account
 * and without the page making any invoice-related network request.
 */

test("homepage renders the tool and its SEO content server-side", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Free Invoice Generator" })).toBeVisible();
  // The editor is a client island but must hydrate and become usable.
  await expect(page.getByLabel("Business name")).toBeVisible();
  await expect(page.getByRole("button", { name: /Download PDF/i })).toBeVisible();
});

test("typing updates totals and the live preview", async ({ page, isMobile }) => {
  await page.goto("/invoice-generator");

  await page.getByLabel("Business name").fill("Acme Studio");
  await page.getByLabel("Customer name").fill("Jane Roberts");

  await page.getByRole("tab", { name: "Items" }).click();
  await page.getByLabel("Item 1 name").fill("Design work");
  await page.getByLabel("Item 1 quantity").fill("10");
  await page.getByLabel("Item 1 rate").fill("85");

  // The line total is computed in-browser and shown next to the row.
  await expect(page.getByText("$850.00").first()).toBeVisible();

  // The preview is the real document, so the typed values appear in it.
  const preview = await showPreview(page, isMobile);
  await expect(preview.getByText("Acme Studio").first()).toBeVisible();
  await expect(preview.getByText("Jane Roberts").first()).toBeVisible();
  await expect(preview.getByText("Design work").first()).toBeVisible();
});

test("tax and discount are applied in the right order", async ({ page, isMobile }) => {
  await page.goto("/invoice-generator");

  await page.getByRole("tab", { name: "Items" }).click();
  await page.getByLabel("Item 1 name").fill("Consulting");
  await page.getByLabel("Item 1 quantity").fill("1");
  await page.getByLabel("Item 1 rate").fill("1000");

  // 10% line discount -> taxable 900
  await page.getByRole("button", { name: "Details" }).first().click();
  // "Discount" also matches the discount-type combobox, so target the number input.
  await page.getByRole("spinbutton", { name: "Discount" }).fill("10");

  // Add an 18% exclusive tax and apply it to the line.
  await page.getByRole("tab", { name: "Tax" }).click();
  await page.getByRole("button", { name: "Add tax" }).click();
  await page.getByLabel("Tax rate").fill("18");

  await page.getByRole("tab", { name: "Items" }).click();
  // Switching tabs unmounts the panel, so the per-item Details section is
  // collapsed again on return — re-open it to reach the tax chips.
  await page.getByRole("button", { name: "Details" }).first().click();
  await page.getByRole("button", { name: /^Tax 18/ }).click();

  // 900 + 162 = 1062 — tax charged on the discounted amount, not on 1000.
  const preview = await showPreview(page, isMobile);
  await expect(preview.getByText("$1,062.00").first()).toBeVisible();
});

test("switching template preserves all entered data", async ({ page, isMobile }) => {
  await page.goto("/invoice-generator");

  await page.getByLabel("Business name").fill("Persistent Co");
  await page.getByRole("tab", { name: "Items" }).click();
  await page.getByLabel("Item 1 name").fill("Retained item");

  await page.getByRole("tab", { name: "Design" }).click();
  await page.getByRole("button", { name: /Corporate/ }).click();

  const preview = await showPreview(page, isMobile);
  await expect(preview.getByText("Persistent Co").first()).toBeVisible();
  await expect(preview.getByText("Retained item").first()).toBeVisible();
});

test("the draft survives a page reload", async ({ page }) => {
  await page.goto("/invoice-generator");
  await page.getByLabel("Business name").fill("Reload Survivor Ltd");

  // Autosave is debounced; wait for the saved indicator rather than a fixed sleep.
  await expect(page.getByText("Saved in this browser")).toBeVisible({ timeout: 5000 });

  await page.reload();
  await expect(page.getByLabel("Business name")).toHaveValue("Reload Survivor Ltd");
});

test("downloads a real PDF without any invoice data leaving the browser", async ({ page }) => {
  const invoiceRequests: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    // Anything that could carry invoice content to a server.
    if (req.method() === "POST" && !url.includes("/_next/")) invoiceRequests.push(url);
  });

  await page.goto("/invoice-generator");
  await page.getByLabel("Business name").fill("PDF Test Co");
  await page.getByRole("tab", { name: "Items" }).click();
  await page.getByLabel("Item 1 name").fill("Billable work");
  await page.getByLabel("Item 1 rate").fill("250");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download PDF/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^invoice-.*\.pdf$/);

  const path = await download.path();
  const { readFileSync } = await import("node:fs");
  const buffer = readFileSync(path);
  expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  expect(buffer.length).toBeGreaterThan(1000);

  // The core privacy claim: no POST carried the invoice anywhere.
  expect(invoiceRequests).toHaveLength(0);
});

test("mobile shows an edit/preview toggle", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only layout behaviour");

  await page.goto("/invoice-generator");
  const previewToggle = page.getByRole("button", { name: "Preview" });
  await expect(previewToggle).toBeVisible();

  await previewToggle.click();
  await expect(page.locator('[data-print="area"]')).toBeVisible();
});

test("downloads a Word document", async ({ page }) => {
  await page.goto("/invoice-generator");
  await page.getByLabel("Business name").fill("Docx Test Co");

  await page.getByRole("button", { name: "More download formats" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: /Word/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^invoice-.*\.docx$/);

  const path = await download.path();
  const { readFileSync } = await import("node:fs");
  const buffer = readFileSync(path);
  // .docx is an OOXML zip package.
  expect(buffer.subarray(0, 2).toString()).toBe("PK");
  expect(buffer.length).toBeGreaterThan(1000);
});

test("renaming a label updates the document", async ({ page, isMobile }) => {
  await page.goto("/invoice-generator");

  await page.getByRole("tab", { name: "Design" }).click();
  await page.getByLabel("Bill To").fill("Consignee");

  const preview = await showPreview(page, isMobile);
  await expect(preview.getByText("Consignee").first()).toBeVisible();
  await expect(preview.getByText("Bill To")).toHaveCount(0);
});

test("every visible column has a matching cell in each row", async ({ page, isMobile }) => {
  // Regression: a column whose header was rendered but which had no cell
  // renderer shifted every subsequent value one column to the left, so the
  // rate appeared under Unit and the amount fell off the row entirely.
  await page.goto("/invoice-generator");

  await page.getByRole("tab", { name: "Items" }).click();
  await page.getByLabel("Item 1 name").fill("Consulting services");
  await page.getByLabel("Item 1 quantity").fill("4");
  await page.getByLabel("Item 1 rate").fill("125");
  await page.getByRole("button", { name: "Details" }).first().click();
  await page.getByLabel("Unit").fill("hrs");

  // Turn on every optional column so all of them are exercised.
  await page.getByRole("tab", { name: "Design" }).click();
  for (const label of ["SKU", "HSN/SAC", "Discount", "Tax"]) {
    // exact: "Tax" would otherwise also match the "Tax breakdown" section toggle.
    const toggle = page.getByRole("switch", { name: label, exact: true });
    if ((await toggle.getAttribute("data-state")) === "unchecked") await toggle.click();
  }

  const preview = await showPreview(page, isMobile);
  const headerCount = await preview.locator("table thead th").count();
  const cellCount = await preview.locator("table tbody tr").first().locator("td").count();

  expect(headerCount).toBeGreaterThan(5);
  expect(cellCount).toBe(headerCount);

  // And the amount must land in the last column, not fall off the end.
  const lastCell = preview.locator("table tbody tr").first().locator("td").last();
  await expect(lastCell).toHaveText("$500.00");
});
