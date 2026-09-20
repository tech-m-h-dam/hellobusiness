import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1400 } });
await p.goto("http://localhost:3100/invoice-generator", { waitUntil: "networkidle" });
await p.getByLabel("Business name").fill("Northwind Studio");
await p.getByLabel("Customer name").fill("Ada Lovelace");
await p.getByRole("tab", { name: "Items" }).click();
// Enough rows to force a second page, so pagination is exercised too.
for (let i = 0; i < 24; i++) {
  if (i > 0) await p.getByRole("button", { name: "Add line item" }).click();
  await p.getByLabel(`Item ${i + 1} name`).fill(`Line item number ${i + 1}`);
  await p.getByLabel(`Item ${i + 1} quantity`).fill("2");
  await p.getByLabel(`Item ${i + 1} rate`).fill("125");
}
await p.waitForTimeout(1000);
await p.pdf({ path: "print-out.pdf", format: "A4", printBackground: true });
await b.close();
console.log("printed");
