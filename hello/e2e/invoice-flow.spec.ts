import { expect, type Page, test } from "@playwright/test";

/**
 * Reveal the invoice preview.
 *
 * On desktop the preview sits beside the editor and is always visible; on
 * mobile it is behind an Edit/Preview toggle by design, so tests that assert on
 * the rendered document have to switch to it first.
 */
/**
 * The editor form panel.
 *
 * The document now carries click-to-edit controls whose accessible names match
 * the form fields (both edit the same value), so anything targeting the form
 * has to say so explicitly.
 */
function form(page: Page) {
  return page.locator("[data-editor-panel]");
}

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
  await expect(form(page).getByLabel("Business name")).toBeVisible();
  await expect(page.getByRole("button", { name: /Download PDF/i })).toBeVisible();
});

test("typing updates totals and the live preview", async ({ page, isMobile }) => {
  await page.goto("/invoice-generator");

  await form(page).getByLabel("Business name").fill("Acme Studio");
  await form(page).getByLabel("Customer name").fill("Jane Roberts");

  await page.getByRole("tab", { name: "Items" }).click();
  await form(page).getByLabel("Item 1 name").fill("Design work");
  await form(page).getByLabel("Item 1 quantity").fill("10");
  await form(page).getByLabel("Item 1 rate").fill("85");

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
  await form(page).getByLabel("Item 1 name").fill("Consulting");
  await form(page).getByLabel("Item 1 quantity").fill("1");
  await form(page).getByLabel("Item 1 rate").fill("1000");

  // 10% line discount -> taxable 900
  await page.getByRole("button", { name: "Details" }).first().click();
  // "Discount" also matches the discount-type combobox, so target the number input.
  await page.getByRole("spinbutton", { name: "Discount" }).fill("10");

  // Add an 18% exclusive tax and apply it to the line.
  await page.getByRole("tab", { name: "Tax" }).click();
  await page.getByRole("button", { name: "Add tax" }).click();
  await form(page).getByLabel("Tax rate").fill("18");

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

  await form(page).getByLabel("Business name").fill("Persistent Co");
  await page.getByRole("tab", { name: "Items" }).click();
  await form(page).getByLabel("Item 1 name").fill("Retained item");

  await page.getByRole("tab", { name: "Design" }).click();
  await page.getByRole("button", { name: /Corporate/ }).click();

  const preview = await showPreview(page, isMobile);
  await expect(preview.getByText("Persistent Co").first()).toBeVisible();
  await expect(preview.getByText("Retained item").first()).toBeVisible();
});

test("the draft survives a page reload", async ({ page }) => {
  await page.goto("/invoice-generator");
  await form(page).getByLabel("Business name").fill("Reload Survivor Ltd");

  // Autosave is debounced; wait for the saved indicator rather than a fixed sleep.
  await expect(page.getByText("Saved in this browser")).toBeVisible({ timeout: 5000 });

  await page.reload();
  await expect(form(page).getByLabel("Business name")).toHaveValue("Reload Survivor Ltd");
});

test("downloads a real PDF without any invoice data leaving the browser", async ({ page }) => {
  const invoiceRequests: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    // Anything that could carry invoice content to a server.
    if (req.method() === "POST" && !url.includes("/_next/")) invoiceRequests.push(url);
  });

  await page.goto("/invoice-generator");
  await form(page).getByLabel("Business name").fill("PDF Test Co");
  await page.getByRole("tab", { name: "Items" }).click();
  await form(page).getByLabel("Item 1 name").fill("Billable work");
  await form(page).getByLabel("Item 1 rate").fill("250");

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
  await form(page).getByLabel("Business name").fill("Docx Test Co");

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
  await form(page).getByLabel("Bill To").fill("Consignee");

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
  await form(page).getByLabel("Item 1 name").fill("Consulting services");
  await form(page).getByLabel("Item 1 quantity").fill("4");
  await form(page).getByLabel("Item 1 rate").fill("125");
  await page.getByRole("button", { name: "Details" }).first().click();
  await form(page).getByLabel("Unit").fill("hrs");

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

test("newly exposed settings actually affect the document", async ({ page, isMobile }) => {
  await page.goto("/invoice-generator");

  // Locale + decimals drive number formatting through Intl.
  await form(page).getByLabel("Number & date format").click();
  await page.getByRole("option", { name: /German/ }).click();
  await form(page).getByLabel("Date style").click();
  await page.getByRole("option", { name: "20/09/2026" }).click();

  await page.getByRole("tab", { name: "Items" }).click();
  await form(page).getByLabel("Item 1 name").fill("Formatted item");
  await form(page).getByLabel("Item 1 quantity").fill("1");
  await form(page).getByLabel("Item 1 rate").fill("1234.5");

  const preview = await showPreview(page, isMobile);
  // German grouping uses "." for thousands and "," for decimals.
  await expect(preview.getByText(/1\.234,50/).first()).toBeVisible();
});

test("payment fields print on the invoice", async ({ page, isMobile }) => {
  await page.goto("/invoice-generator");

  await page.getByRole("tab", { name: "Payment" }).click();
  await page.getByRole("switch", { name: "Show bank details on the invoice" }).click();
  await form(page).getByLabel("IBAN").fill("GB33BUKB20201555555555");
  await form(page).getByLabel("SWIFT / BIC").fill("BUKBGB22");
  await form(page).getByLabel("Payment instructions").fill("Quote the invoice number as reference.");

  const preview = await showPreview(page, isMobile);
  await expect(preview.getByText(/GB33BUKB20201555555555/)).toBeVisible();
  await expect(preview.getByText(/BUKBGB22/)).toBeVisible();
  await expect(preview.getByText(/Quote the invoice number/)).toBeVisible();
});

test("printing outputs only the invoice, unscaled", async ({ page, isMobile }) => {
  test.skip(isMobile, "print layout is verified once, on desktop");

  await page.goto("/invoice-generator");
  await form(page).getByLabel("Business name").fill("Print Regression Co");
  await page.getByRole("tab", { name: "Items" }).click();
  await form(page).getByLabel("Item 1 name").fill("Printed line item");
  await form(page).getByLabel("Item 1 rate").fill("100");
  await page.waitForTimeout(500);

  await page.emulateMedia({ media: "print" });

  // The preview scales a page-sized sheet to fit the column; on paper it must
  // print at full size, not at whatever the preview happened to be scaled to.
  const transform = await page
    .locator('[data-print="area"]')
    .evaluate((el) => getComputedStyle(el).transform);
  expect(transform).toBe("none");

  // The wrapper pins itself to the scaled preview height on screen; if that
  // survived into print it would clip a multi-page invoice.
  const wrapperOverflow = await page
    .locator('[data-print="sheet"]')
    .evaluate((el) => getComputedStyle(el).overflow);
  expect(wrapperOverflow).toBe("visible");

  // The surrounding marketing copy and SEO prose must not print.
  await expect(page.getByRole("heading", { name: "Invoice Generator", level: 1 })).toBeHidden();
  await expect(page.getByRole("heading", { name: /How the invoice generator works/ })).toBeHidden();
  await expect(page.locator("header[data-site-header]")).toBeHidden();
  await expect(page.locator("footer[data-site-footer]")).toBeHidden();

  // The invoice itself is still there.
  // The business name appears in both the header and the footer line.
  await expect(
    page.locator('[data-print="area"]').getByText("Print Regression Co").first(),
  ).toBeVisible();
});

test("saving and applying a custom template", async ({ page }) => {
  await page.goto("/invoice-generator");

  // Style the invoice, then save that styling as a template.
  await page.getByRole("tab", { name: "Design" }).click();
  await form(page).getByLabel("Primary colour").fill("#b91c1c");
  await form(page).getByLabel("Bill To").fill("Consignee");

  await page.getByRole("button", { name: "My templates" }).click();
  await page.getByLabel("Template name").fill("Crimson studio");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Template saved in this browser")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  // Change the styling away from what was saved.
  await form(page).getByLabel("Primary colour").fill("#2563eb");
  await form(page).getByLabel("Bill To").fill("");

  // Re-applying the saved template restores colour *and* renamed labels.
  await page.getByRole("button", { name: "My templates" }).click();
  await page.getByRole("button", { name: "Use" }).first().click();

  await expect(form(page).getByLabel("Primary colour")).toHaveValue("#b91c1c");
  await expect(form(page).getByLabel("Bill To")).toHaveValue("Consignee");
});

test("saved templates carry no invoice content", async ({ page }) => {
  await page.goto("/invoice-generator");
  await form(page).getByLabel("Business name").fill("Template Owner Ltd");

  await page.getByRole("tab", { name: "Design" }).click();
  await page.getByRole("button", { name: "My templates" }).click();
  await page.getByLabel("Template name").fill("Styling only");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: "Done" }).click();

  // Applying a template to a different invoice must not overwrite its content.
  await page.getByRole("tab", { name: "Details" }).click();
  await form(page).getByLabel("Business name").fill("Different Business");
  await page.getByRole("tab", { name: "Design" }).click();
  await page.getByRole("button", { name: "My templates" }).click();
  await page.getByRole("button", { name: "Use" }).first().click();

  await page.getByRole("tab", { name: "Details" }).click();
  await expect(form(page).getByLabel("Business name")).toHaveValue("Different Business");
});

test("switching the interface language", async ({ page }) => {
  await page.goto("/invoice-generator");

  await expect(page.getByRole("tab", { name: "Items" })).toBeVisible();

  await page.getByLabel("Language").click();
  await page.getByRole("option", { name: "Deutsch" }).click();

  // Editor chrome translates …
  await expect(page.getByRole("tab", { name: "Positionen" })).toBeVisible();
  await expect(page.getByRole("button", { name: /PDF herunterladen/ })).toBeVisible();

  // … and the choice survives a reload.
  await page.reload();
  await expect(page.getByRole("tab", { name: "Positionen" })).toBeVisible();
});

test("description can be given its own labelled column", async ({ page, isMobile }) => {
  await page.goto("/invoice-generator");

  await page.getByRole("tab", { name: "Items" }).click();
  await form(page).getByLabel("Item 1 name").fill("Website build");
  await form(page).getByLabel("Item 1 rate").fill("100");
  await page.getByRole("button", { name: "Details" }).first().click();
  await form(page).getByLabel("Description").fill("Three page marketing site");

  await page.getByRole("tab", { name: "Design" }).click();
  await page.getByRole("switch", { name: "Description (own column)" }).click();
  // Rename it, to prove the label drives the column header. Targeted by id
  // because "Description" also matches the column toggle and the item field.
  await page.locator("#label-description").fill("Scope of work");

  const preview = await showPreview(page, isMobile);
  await expect(preview.getByRole("columnheader", { name: "Scope of work" })).toBeVisible();
  await expect(preview.getByText("Three page marketing site")).toBeVisible();
});

test("fields can be edited directly on the document", async ({ page, isMobile }) => {
  // Inline editing is intentionally disabled at phone scale — the document
  // renders at ~50%, which would mean ~5px tap targets. Editing there is
  // done in the touch-sized form behind the Edit/Preview toggle.
  test.skip(isMobile, "click-to-edit is a desktop/tablet affordance");
  await page.goto("/invoice-generator");
  const doc = await showPreview(page, isMobile);

  // Business name, straight on the document.
  await doc.getByRole("button", { name: /Business name/ }).click();
  await doc.getByRole("textbox", { name: "Business name" }).fill("Inline Editing Co");
  await page.keyboard.press("Enter");
  await expect(doc.getByText("Inline Editing Co").first()).toBeVisible();

  // A line item, straight on the document.
  await doc.getByRole("button", { name: /Item 1 name/ }).click();
  await doc.getByRole("textbox", { name: "Item 1 name" }).fill("Edited on the page");
  await page.keyboard.press("Enter");
  await expect(doc.getByText("Edited on the page")).toBeVisible();

  // The side form is the same state, not a second copy of it.
  if (!isMobile) {
    await expect(form(page).getByLabel("Business name")).toHaveValue("Inline Editing Co");
  }
});

test("any printed label can be renamed by clicking it", async ({ page, isMobile }) => {
  // Inline editing is intentionally disabled at phone scale — the document
  // renders at ~50%, which would mean ~5px tap targets. Editing there is
  // done in the touch-sized form behind the Edit/Preview toggle.
  test.skip(isMobile, "click-to-edit is a desktop/tablet affordance");
  await page.goto("/invoice-generator");
  const doc = await showPreview(page, isMobile);

  await doc.getByRole("button", { name: /Label: Bill To/ }).click();
  await doc.getByRole("textbox", { name: /Label/ }).fill("Consignee");
  await page.keyboard.press("Enter");

  await expect(doc.getByText("Consignee").first()).toBeVisible();
  await expect(doc.getByText("Bill To")).toHaveCount(0);
});

test("escape abandons an inline edit", async ({ page, isMobile }) => {
  // Inline editing is intentionally disabled at phone scale — the document
  // renders at ~50%, which would mean ~5px tap targets. Editing there is
  // done in the touch-sized form behind the Edit/Preview toggle.
  test.skip(isMobile, "click-to-edit is a desktop/tablet affordance");
  await page.goto("/invoice-generator");
  const doc = await showPreview(page, isMobile);

  await doc.getByRole("button", { name: /Business name/ }).click();
  await doc.getByRole("textbox", { name: "Business name" }).fill("Should not persist");
  await page.keyboard.press("Escape");

  await expect(doc.getByText("Should not persist")).toHaveCount(0);
});

test("dates and money stay formatted on the document while editing raw values", async ({
  page,
  isMobile,
}) => {
  await page.goto("/invoice-generator");

  await page.getByRole("tab", { name: "Items" }).click();
  // Scoped to the editor panel: the same accessible name may also belong to
  // the click-to-edit control on the document itself.
  await form(page).getByLabel("Item 1 rate").fill("1250");
  await page.waitForTimeout(400);

  // Reveal the document only after the form work — on mobile the two swap.
  const doc = await showPreview(page, isMobile);

  // Displayed formatted, even though the editable value behind it is a number.
  await expect(doc.getByText("$1,250.00").first()).toBeVisible();
  // The date reads as a formatted date, not the raw ISO string.
  await expect(doc.getByText(/\d{1,2} \w{3} \d{4}/).first()).toBeVisible();
});

test("language is switched from the navbar and applies across the app", async ({ page, isMobile }) => {
  await page.goto("/invoice-templates");

  await page.getByLabel("Language").click();
  await page.getByRole("option", { name: "Français" }).click();

  // The CTA is visible at every width; the nav links collapse on phones.
  await expect(page.getByRole("link", { name: /Créer une facture/ })).toBeVisible();
  if (!isMobile) {
    await expect(page.getByRole("link", { name: "Modèles" })).toBeVisible();
  }

  // … and carries over to the editor on another route.
  await page.goto("/invoice-generator");
  await expect(page.getByRole("tab", { name: "Articles" })).toBeVisible();
});
