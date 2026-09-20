import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const w of [390, 768, 1024, 1280, 1512]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto("http://localhost:3100/invoice-generator", { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const out = {};
    const toolbar = document.querySelector('[data-print="hide"]');
    if (toolbar) {
      const tb = toolbar.getBoundingClientRect();
      out.toolbar = { l: Math.round(tb.left), r: Math.round(tb.right), w: Math.round(tb.width) };
      // Does any child stick out past the toolbar box?
      const overflow = [];
      toolbar.querySelectorAll("button, a, div").forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.width && (b.right > tb.right + 1 || b.left < tb.left - 1)) {
          overflow.push({ txt: (el.textContent || el.ariaLabel || "").trim().slice(0, 24), r: Math.round(b.right), l: Math.round(b.left) });
        }
      });
      out.overflowing = overflow.slice(0, 5);
    }
    out.docScrollW = document.documentElement.scrollWidth;
    out.docClientW = document.documentElement.clientWidth;
    out.horizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    return out;
  });
  console.log(w + "px:", JSON.stringify(r));
  await p.close();
}
await b.close();
