/** Map the PDF's standard-14 font names to web-safe font stacks for the HTML preview. */
export function webFontStack(fontFamily: "Helvetica" | "Times-Roman" | "Courier"): string {
  switch (fontFamily) {
    case "Times-Roman":
      return '"Times New Roman", Times, serif';
    case "Courier":
      return '"Courier New", Courier, monospace';
    default:
      return 'Helvetica, Arial, "Segoe UI", sans-serif';
  }
}
