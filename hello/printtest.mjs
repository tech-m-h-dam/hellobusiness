import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1400 } });
await p.goto("http://localhost:3100/invoice-generator", { waitUntil: "networkidle" });
await p.getByLabel("Business name").fill("Print Diagnostics Ltd");
await p.getByRole("tab", { name: "Items" }).click();
await p.getByLabel("Item 1 name").fill("Diagnostic line item");
await p.getByLabel("Item 1 rate").fill("100");
await p.waitForTimeout(700);

await p.emulateMedia({ media: "print" });

// What geometry does the printed document actually have?
const info = await p.evaluate(() => {
  const el = document.querySelector('[data-print="area"]');
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const wrap = el.parentElement;
  const wcs = getComputedStyle(wrap);
  return {
    docTransform: cs.transform,
    docWidth: cs.width,
    docMinHeight: cs.minHeight,
    docOverflow: cs.overflow,
    rectW: Math.round(r.width),
    rectH: Math.round(r.height),
    wrapHeightInline: wrap.style.height,
    wrapOverflow: wcs.overflow,
    wrapHeight: wcs.height,
  };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
