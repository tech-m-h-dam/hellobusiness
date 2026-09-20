import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1200 } });
await p.goto("http://localhost:3100/invoice-generator", { waitUntil: "networkidle" });
await p.getByLabel("Business name").fill("Print Regression Co");
await p.waitForTimeout(600);
await p.emulateMedia({ media: "print" });
const info = await p.evaluate(() => {
  const area = document.querySelector('[data-print="area"]');
  const r = area.getBoundingClientRect();
  // Find the element containing the business name text.
  const walker = document.createTreeWalker(area, NodeFilter.SHOW_ELEMENT);
  let found = null;
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.textContent.trim() === "Print Regression Co") { found = n; break; }
  }
  const fr = found ? found.getBoundingClientRect() : null;
  const fcs = found ? getComputedStyle(found) : null;
  let chainHidden = [];
  let n = found;
  while (n && n !== document.body) {
    const cs = getComputedStyle(n);
    if (cs.display === "none" || cs.visibility === "hidden")
      chainHidden.push(n.tagName + "." + (n.className || "").toString().slice(0, 40) + " -> " + cs.display + "/" + cs.visibility);
    n = n.parentElement;
  }
  return {
    areaBox: { w: Math.round(r.width), h: Math.round(r.height) },
    foundTag: found ? found.tagName : null,
    foundBox: fr ? { w: Math.round(fr.width), h: Math.round(fr.height) } : null,
    foundDisplay: fcs ? fcs.display : null,
    foundVisibility: fcs ? fcs.visibility : null,
    chainHidden,
  };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
