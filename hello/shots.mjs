import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const [name, w, h] of [["mobile", 390, 844], ["desktop", 1440, 950]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => { try { localStorage.setItem("tour-seen-v1","1"); } catch {} });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3100/invoice-generator", { waitUntil: "networkidle" });
  const panel = p.locator("[data-editor-panel]");
  await panel.getByLabel("Business name").fill("Northwind Studio");
  await panel.getByLabel("Customer name").fill("Ada Lovelace");
  await p.getByRole("tab", { name: "Items" }).click();
  await panel.getByLabel("Item 1 name").fill("Brand identity design");
  await panel.getByLabel("Item 1 quantity").fill("12");
  await panel.getByLabel("Item 1 rate").fill("145");
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${name}.png` });
  await ctx.close();
}
await b.close();
