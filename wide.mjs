import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const w of [390, 768]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto("http://localhost:3100/invoice-generator", { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  const offenders = await p.evaluate((vw) => {
    const out = [];
    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > vw + 1) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 70),
          right: Math.round(r.right),
          w: Math.round(r.width),
          txt: (el.textContent || "").trim().slice(0, 30),
        });
      }
    });
    // Deepest few only — ancestors repeat the same overflow.
    return out.slice(-6);
  }, w);
  console.log("=== " + w + "px ===");
  offenders.forEach(o => console.log(" ", JSON.stringify(o)));
  await p.close();
}
await b.close();
