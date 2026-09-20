import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const w of [390, 768, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: 300 } });
  await p.goto("http://localhost:3100/invoice-generator", { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  await p.locator("header[data-site-header]").screenshot({ path: `hdr-${w}.png` });
  const scroll = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  console.log(w + "px horizontal scroll:", scroll);
  await p.close();
}
await b.close();
