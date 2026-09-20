import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1200 } });
for (const url of ["/invoice-generator", "/", "/invoice-templates/modern"]) {
  await p.goto("http://localhost:3100" + url, { waitUntil: "networkidle" });
  const d = await p.evaluate(() => {
    const el = document.querySelector('[data-print="area"]');
    if (!el) return "no print area";
    let n = el, depth = 0, chain = [];
    while (n && n !== document.body) { chain.unshift(n.tagName.toLowerCase()); n = n.parentElement; depth++; }
    return { depth, chain: chain.join(" > ") };
  });
  console.log(url, JSON.stringify(d));
}
await b.close();
