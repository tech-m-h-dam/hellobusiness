/**
 * Long-form guides (spec section 26).
 *
 * Content is authored as structured blocks rather than raw HTML strings so the
 * renderer controls all markup — no dangerouslySetInnerHTML for editorial
 * content, which removes a whole class of XSS risk and keeps typography
 * consistent. When the CMS lands, BlogPost rows map onto this same shape.
 */

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; text: string }
  | { type: "cta"; href: string; label: string; text: string };

export type Guide = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  /** The 2–4 sentence direct answer rendered before anything else (spec 33). */
  answer: string;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  category: "Basics" | "Tax" | "Getting paid" | "Design";
  blocks: GuideBlock[];
  faqs?: { question: string; answer: string }[];
  related: { href: string; label: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-create-an-invoice",
    title: "How to create an invoice",
    seoTitle: "How to Create an Invoice (Step-by-Step, with Examples)",
    description:
      "A step-by-step guide to creating a professional invoice: what to include, how to number it, how to handle tax and discounts, and how to send it so you get paid.",
    answer:
      "To create an invoice, put your business details and your customer's at the top, give it a unique invoice number and a date, list each item or service with its quantity and rate, add any tax or discount, then show the total due and how to pay it. A complete invoice takes about two minutes to produce and should never be sent without a stated due date.",
    publishedAt: "2026-01-15",
    updatedAt: "2026-09-01",
    readingMinutes: 7,
    category: "Basics",
    blocks: [
      { type: "h2", text: "The eight things every invoice needs" },
      {
        type: "p",
        text: "An invoice is a payment request that also has to survive being filed, audited and possibly disputed months later. That dual purpose is what drives the standard set of fields.",
      },
      {
        type: "ol",
        items: [
          "The word “Invoice”, so it is not mistaken for a quote or a receipt.",
          "A unique invoice number, used by both sides to reference the transaction.",
          "The invoice date, and separately a due date.",
          "Your business name, address and contact details, plus your tax number if you are registered.",
          "Your customer’s name, company and billing address.",
          "A line for each item or service: description, quantity, unit price, line total.",
          "The subtotal, any discount, any tax broken out by rate, and the final total due.",
          "How to pay — bank details, a payment link, or a QR code — and your payment terms.",
        ],
      },
      { type: "h2", text: "Step 1: Add your business details" },
      {
        type: "p",
        text: "Use the legal or trading name you actually invoice under, not an abbreviation. Include an email address that you monitor: the majority of invoice queries arrive by reply, and an unanswered query is an unpaid invoice. If you are registered for VAT, GST or an equivalent, your registration number belongs here — in most jurisdictions its absence makes the document invalid as a tax invoice.",
      },
      { type: "h2", text: "Step 2: Add your customer" },
      {
        type: "p",
        text: "Invoice the legal entity you contracted with, not the individual you dealt with. For larger organisations that distinction determines whether your invoice can be paid at all. If your customer is tax-registered and you are issuing a tax invoice, include their registration number too.",
      },
      { type: "h2", text: "Step 3: Number it properly" },
      {
        type: "p",
        text: "Invoice numbers should be unique and sequential, with no gaps. A gap looks like a deleted invoice to an auditor. A simple running series (INV-1001, INV-1002) is enough for most businesses; adding a year prefix (2026-001) makes year-end reconciliation easier.",
      },
      {
        type: "callout",
        text: "Never reuse an invoice number, even for a corrected invoice. Issue a credit note against the original and then a fresh invoice with a new number.",
      },
      { type: "h2", text: "Step 4: Write the line items" },
      {
        type: "p",
        text: "Each line should be specific enough that someone who did not commission the work can approve it. Compare “Consulting — 12 hours” with “Pricing model review and workshop facilitation, 12 hours @ £120”. The second gets paid faster because it answers the approver's question before they ask it.",
      },
      {
        type: "table",
        headers: ["Field", "Example", "Why"],
        rows: [
          ["Description", "Landing page design, 2 revisions", "Defines the scope actually delivered"],
          ["Quantity", "12", "Supports decimals — 7.5 hours bills correctly"],
          ["Unit", "hrs", "Removes ambiguity between hours, days and units"],
          ["Rate", "120.00", "The agreed price per unit"],
          ["Amount", "1,440.00", "Quantity × rate, after any line discount"],
        ],
      },
      { type: "h2", text: "Step 5: Apply tax and discounts in the right order" },
      {
        type: "p",
        text: "If your invoice has both a discount and a tax, apply the discount first and calculate tax on the discounted amount. Tax is charged on the consideration actually paid, so calculating it on the pre-discount figure overstates the tax and overcharges your customer. A £1,000 line with a 10% discount and 20% VAT is £900 net, £180 VAT, £1,080 total — not £1,200 less a discount.",
      },
      { type: "h2", text: "Step 6: State the payment terms and due date" },
      {
        type: "p",
        text: "“Due on receipt” is weaker than a specific date, because it has no clear breach point. Put an actual due date on the invoice and state the terms in words as well (“Payment due within 14 days”). If you charge late fees, say so here — you generally cannot apply a penalty that was never disclosed.",
      },
      { type: "h2", text: "Step 7: Send it to the right person" },
      {
        type: "p",
        text: "At anything larger than a sole trader, the person who hired you is rarely the person who pays you. Send the invoice to accounts payable and copy your day-to-day contact. If your customer issued a purchase order, quote the PO number — invoices without one are routinely parked without anyone telling you.",
      },
      {
        type: "cta",
        href: "/invoice-generator",
        label: "Open the free invoice generator",
        text: "You can work through all seven steps right now — the generator runs in your browser, needs no account, and downloads a PDF at the end.",
      },
    ],
    faqs: [
      {
        question: "What is the difference between an invoice and a receipt?",
        answer:
          "An invoice requests payment; a receipt confirms payment was made. The invoice comes first and creates the obligation, the receipt closes it out.",
      },
      {
        question: "Do I need to be a registered company to send an invoice?",
        answer:
          "In most countries a sole trader can invoice under their own name. Tax registration requirements depend on your turnover and jurisdiction, so check locally — but the invoice format itself is the same.",
      },
      {
        question: "How soon should I send an invoice?",
        answer:
          "As soon as the work is delivered. Payment terms run from the invoice date, so a week's delay in sending is a week's delay in getting paid.",
      },
    ],
    related: [
      { href: "/guides/what-should-an-invoice-include", label: "What should an invoice include?" },
      { href: "/guides/invoice-numbering", label: "Invoice numbering that scales" },
      { href: "/guides/invoice-payment-terms", label: "Invoice payment terms explained" },
    ],
  },
  {
    slug: "what-should-an-invoice-include",
    title: "What should an invoice include?",
    seoTitle: "What Should an Invoice Include? (Complete Checklist)",
    description:
      "A complete checklist of what to include on an invoice, which fields are legally expected, which are optional, and what changes for tax invoices.",
    answer:
      "An invoice should include the word “Invoice”, a unique invoice number, the invoice and due dates, full details for both you and your customer, an itemised list of what is being charged, the subtotal, any tax and discount, the total due, and how to pay. If you are tax-registered, it also needs your registration number and a tax breakdown by rate.",
    publishedAt: "2026-01-22",
    updatedAt: "2026-08-20",
    readingMinutes: 6,
    category: "Basics",
    blocks: [
      { type: "h2", text: "The required fields" },
      {
        type: "p",
        text: "These are the fields that appear on essentially every valid invoice, regardless of country or industry. Omitting one is the most common reason an invoice is queried or returned.",
      },
      {
        type: "table",
        headers: ["Field", "Required?", "Notes"],
        rows: [
          ["The word “Invoice”", "Yes", "Distinguishes it from a quote, estimate or receipt"],
          ["Invoice number", "Yes", "Unique and sequential, no gaps"],
          ["Invoice date", "Yes", "The date of issue; payment terms run from here"],
          ["Due date", "Strongly recommended", "A specific date, not “on receipt”"],
          ["Your business details", "Yes", "Legal/trading name, address, email"],
          ["Your tax number", "If registered", "VAT/GST number — required for a tax invoice"],
          ["Customer details", "Yes", "The legal entity being billed, not your contact"],
          ["Customer tax number", "If applicable", "Required on tax invoices in many jurisdictions"],
          ["Line items", "Yes", "Description, quantity, unit price, line total"],
          ["Subtotal", "Yes", "Before tax"],
          ["Tax breakdown", "If charging tax", "Rate and amount, per rate"],
          ["Total due", "Yes", "The single number to be paid"],
          ["Payment details", "Yes in practice", "Removes the commonest excuse for delay"],
        ],
      },
      { type: "h2", text: "Fields worth adding even though they are optional" },
      {
        type: "ul",
        items: [
          "Purchase order number — often mandatory in practice at larger companies, even when not legally required.",
          "A project or engagement reference, so the charge maps to the customer's own cost tracking.",
          "Service period, for retainers and recurring work.",
          "Notes — a one-line thank you, or context for an unusual charge.",
          "Payment terms in words, alongside the due date.",
          "A QR code for payment, which measurably reduces friction on mobile.",
        ],
      },
      { type: "h2", text: "What changes for a tax invoice" },
      {
        type: "p",
        text: "A tax invoice has to let the buyer account for or reclaim the tax, which means the tax cannot simply be folded into a total. You need the taxable value, the rate applied, and the tax amount shown separately — per rate, if you charge more than one. Under Indian GST you additionally need HSN or SAC codes per line, both parties' GSTINs, and CGST/SGST shown separately for intra-state supply or IGST for inter-state supply.",
      },
      {
        type: "cta",
        href: "/gst-invoice-generator",
        label: "Open the GST invoice generator",
        text: "If you need a GST invoice specifically, this sets up the HSN/SAC column, the tax split and the amount-in-words line for you.",
      },
      { type: "h2", text: "What not to put on an invoice" },
      {
        type: "ul",
        items: [
          "Bank credentials beyond what is needed to receive a payment — never passwords or full card numbers.",
          "Internal cost breakdowns or margins.",
          "Vague catch-all lines such as “miscellaneous”, which invite queries.",
          "A different total to the one you quoted, without an explanatory line.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does an invoice have to include a due date?",
        answer:
          "It is not universally required by law, but omitting it is a practical mistake: without a stated due date you have no clear point at which payment is late, which weakens any follow-up.",
      },
      {
        question: "Do I need my customer's tax number on the invoice?",
        answer:
          "For a tax invoice to a registered business, usually yes — many jurisdictions require the recipient's registration number for them to reclaim the tax. For consumers, no.",
      },
    ],
    related: [
      { href: "/guides/how-to-create-an-invoice", label: "How to create an invoice" },
      { href: "/guides/invoice-vs-receipt", label: "Invoice vs receipt" },
      { href: "/gst-invoice-generator", label: "GST invoice generator" },
    ],
  },
  {
    slug: "invoice-numbering",
    title: "Invoice numbering that scales",
    seoTitle: "Invoice Numbering: Systems, Examples and Mistakes to Avoid",
    description:
      "How to number invoices so they stay unique, sequential and auditable — with formats that work for freelancers and growing businesses.",
    answer:
      "Invoice numbers must be unique and sequential with no gaps, because a missing number looks like a deleted invoice to an auditor. A simple running series such as INV-1001 works for most businesses; adding a year prefix (2026-001) makes year-end reconciliation easier. Never reuse a number, and never renumber an invoice you have already sent.",
    publishedAt: "2026-02-05",
    readingMinutes: 5,
    category: "Basics",
    blocks: [
      { type: "h2", text: "Three numbering systems that work" },
      {
        type: "table",
        headers: ["System", "Example", "Best for"],
        rows: [
          ["Sequential", "INV-1001, INV-1002", "Most businesses — simplest to keep gapless"],
          ["Year-prefixed", "2026-001, 2026-002", "Anyone who reconciles by financial year"],
          ["Customer-prefixed", "ACME-024", "Agencies billing a few large accounts repeatedly"],
        ],
      },
      {
        type: "p",
        text: "Whichever you choose, keep it consistent. Switching systems mid-year creates exactly the ambiguity that numbering exists to prevent. If you must switch, start the new series cleanly at a year boundary.",
      },
      { type: "h2", text: "Why gaps matter" },
      {
        type: "p",
        text: "A gap in an invoice sequence raises an obvious question: was there an invoice there that has since been removed? That is the pattern auditors look for, because it is what revenue suppression looks like. If you void an invoice, keep the number in the series and mark it cancelled rather than deleting it and moving on.",
      },
      { type: "h2", text: "Corrections and credit notes" },
      {
        type: "p",
        text: "If you have already sent an invoice and it is wrong, do not edit and resend it under the same number — your customer may already have entered the original. Issue a credit note that references the original invoice number, then raise a new invoice with the next number in the series. The trail then explains itself without anyone having to remember a conversation.",
      },
      {
        type: "callout",
        text: "Avoid starting at 1. INV-0001 tells every customer you have never invoiced anyone before. Starting at 1001 costs nothing and says nothing.",
      },
      {
        type: "cta",
        href: "/invoice-generator",
        label: "Create your next invoice",
        text: "The generator suggests a number for you, and you can override it with whatever series you keep.",
      },
    ],
    related: [
      { href: "/guides/how-to-create-an-invoice", label: "How to create an invoice" },
      { href: "/guides/what-should-an-invoice-include", label: "What should an invoice include?" },
    ],
  },
  {
    slug: "invoice-payment-terms",
    title: "Invoice payment terms explained",
    seoTitle: "Invoice Payment Terms Explained (Net 30, Net 15, Due on Receipt)",
    description:
      "What Net 30, Net 15 and due on receipt actually mean, which terms get you paid fastest, and how to set terms you can enforce.",
    answer:
      "Payment terms state when an invoice must be paid. Net 30 means payment is due 30 days from the invoice date, Net 15 within 15 days, and due on receipt means immediately. Shorter terms with a specific due date get paid faster than long or vague ones, and terms you never stated are terms you cannot enforce.",
    publishedAt: "2026-02-18",
    readingMinutes: 6,
    category: "Getting paid",
    blocks: [
      { type: "h2", text: "The common terms, translated" },
      {
        type: "table",
        headers: ["Term", "Means", "Typical use"],
        rows: [
          ["Due on receipt", "Pay immediately", "Small jobs, new clients, deposits"],
          ["Net 7", "Within 7 days of the invoice date", "Freelancers with good client relationships"],
          ["Net 15", "Within 15 days", "A good default for small business"],
          ["Net 30", "Within 30 days", "Standard for corporate clients"],
          ["Net 60 / 90", "Within 60 / 90 days", "Large enterprise and retail; expect to be asked"],
          ["2/10 Net 30", "2% discount if paid within 10 days, otherwise due in 30", "Encouraging early payment"],
        ],
      },
      { type: "h2", text: "Shorter terms genuinely work" },
      {
        type: "p",
        text: "Most invoices are paid close to their due date rather than as soon as they arrive, because they enter a payment run scheduled around that date. Moving from Net 30 to Net 15 therefore tends to move the actual payment date, not just the nominal one. If you have never asked, ask — it is a rare client who negotiates back.",
      },
      { type: "h2", text: "Make the terms enforceable" },
      {
        type: "ul",
        items: [
          "State the terms on the invoice itself, not only in the contract.",
          "Put a specific due date on the document — a date is unambiguous in a way “Net 30” is not.",
          "If you charge late fees, disclose the rate on the invoice. Undisclosed penalties are difficult to apply.",
          "Keep terms consistent across invoices to the same client, or you invite argument about which applied.",
        ],
      },
      { type: "h2", text: "Early-payment discounts" },
      {
        type: "p",
        text: "A 2% discount for paying within 10 days is a real cost — roughly 36% annualised against Net 30 — so use it only if cash flow genuinely justifies it. For most small businesses, shortening the terms and following up promptly is cheaper than discounting.",
      },
      {
        type: "cta",
        href: "/guides/how-to-follow-up-on-unpaid-invoices",
        label: "How to follow up on unpaid invoices",
        text: "Terms only matter if you act on them. This covers the follow-up sequence that works without damaging the relationship.",
      },
    ],
    faqs: [
      {
        question: "Does Net 30 mean 30 days from the invoice date or from delivery?",
        answer:
          "From the invoice date, unless your contract says otherwise. This is why sending the invoice promptly matters — the clock does not start when you finish the work.",
      },
      {
        question: "Can I charge interest on a late invoice?",
        answer:
          "Often yes, and some jurisdictions grant a statutory right to interest on late commercial payments. But state the rate on the invoice up front; enforcing an undisclosed charge is much harder.",
      },
    ],
    related: [
      { href: "/guides/how-to-follow-up-on-unpaid-invoices", label: "Following up on unpaid invoices" },
      { href: "/guides/how-to-create-an-invoice", label: "How to create an invoice" },
    ],
  },
  {
    slug: "invoice-vs-receipt",
    title: "Invoice vs receipt",
    seoTitle: "Invoice vs Receipt: What's the Difference?",
    description:
      "The difference between an invoice and a receipt, when to send each, and why the distinction matters for your records and your customer's.",
    answer:
      "An invoice requests payment and is issued before payment is made; a receipt confirms payment and is issued after. The invoice creates the obligation and states what is owed and by when; the receipt is proof that the obligation was settled. Most transactions generate both.",
    publishedAt: "2026-03-02",
    readingMinutes: 4,
    category: "Basics",
    blocks: [
      {
        type: "table",
        headers: ["", "Invoice", "Receipt"],
        rows: [
          ["Purpose", "Requests payment", "Confirms payment"],
          ["Issued", "Before payment", "After payment"],
          ["Key fields", "Due date, payment terms, amount due", "Amount paid, payment date, method"],
          ["Used by buyer for", "Approving and scheduling payment", "Proving the expense"],
          ["Used by seller for", "Accounts receivable", "Closing out the receivable"],
        ],
      },
      { type: "h2", text: "Where the confusion comes from" },
      {
        type: "p",
        text: "In retail the two collapse into one document: you pay at the till and receive a receipt, with no invoice in between, because there was never a period during which money was owed. In B2B they stay separate, because the gap between delivery and payment is exactly where the invoice does its work.",
      },
      { type: "h2", text: "Related documents worth distinguishing" },
      {
        type: "ul",
        items: [
          "Quote / estimate — a proposed price before work is agreed. Not a payment request, and not binding in the way an invoice is.",
          "Proforma invoice — a preview of an invoice, often used to obtain approval or arrange payment in advance. It is not a tax invoice and should not be entered as one.",
          "Credit note — reverses all or part of an invoice already issued, referencing the original number.",
          "Statement — a summary of all outstanding invoices for a customer, not a payment request for a single transaction.",
        ],
      },
      {
        type: "cta",
        href: "/invoice-generator",
        label: "Create an invoice",
        text: "You can set the document title to Invoice, Tax Invoice or Proforma Invoice, so the same tool covers each of these.",
      },
    ],
    related: [
      { href: "/guides/what-should-an-invoice-include", label: "What should an invoice include?" },
      { href: "/guides/how-to-create-an-invoice", label: "How to create an invoice" },
    ],
  },
  {
    slug: "invoice-tax-calculation",
    title: "How invoice tax is calculated",
    seoTitle: "How Invoice Tax Is Calculated (Inclusive vs Exclusive, Worked Examples)",
    description:
      "How tax on an invoice is calculated, the difference between inclusive and exclusive tax, how discounts interact with tax, and where rounding goes wrong.",
    answer:
      "Tax on an invoice is calculated on the taxable value — the line amount after any discount. With exclusive tax the tax is added on top of your price; with inclusive tax it is already contained in the price and is extracted from it. Discounts must be applied before tax is calculated, otherwise the tax is overstated.",
    publishedAt: "2026-03-14",
    updatedAt: "2026-09-10",
    readingMinutes: 7,
    category: "Tax",
    blocks: [
      { type: "h2", text: "Exclusive tax: added on top" },
      {
        type: "p",
        text: "This is the usual B2B arrangement. You quote a price before tax and the tax is added to it.",
      },
      {
        type: "table",
        headers: ["Step", "Calculation", "Amount"],
        rows: [
          ["Line amount", "2 × 500.00", "1,000.00"],
          ["Taxable value", "no discount", "1,000.00"],
          ["Tax at 18%", "1,000.00 × 0.18", "180.00"],
          ["Line total", "1,000.00 + 180.00", "1,180.00"],
        ],
      },
      { type: "h2", text: "Inclusive tax: extracted from the price" },
      {
        type: "p",
        text: "Common in consumer pricing, where the advertised price is what the customer pays. The tax is worked backwards out of the gross amount rather than added to it.",
      },
      {
        type: "table",
        headers: ["Step", "Calculation", "Amount"],
        rows: [
          ["Line amount (gross)", "1 × 1,180.00", "1,180.00"],
          ["Taxable value", "1,180.00 ÷ 1.18", "1,000.00"],
          ["Tax at 18%", "1,180.00 − 1,000.00", "180.00"],
          ["Line total", "unchanged", "1,180.00"],
        ],
      },
      {
        type: "callout",
        text: "Derive inclusive tax as gross minus net, not as gross × rate. Multiplying gives 212.40 here, which is wrong — and the parts would not add back to the price.",
      },
      { type: "h2", text: "Discounts come before tax" },
      {
        type: "p",
        text: "Tax is charged on what is actually paid. A 1,000.00 line with a 10% discount and 18% tax is 900.00 taxable, 162.00 tax, 1,062.00 total. Calculating the tax first and then discounting would give 1,062.00 as well in this simple case — but as soon as the discount is invoice-level and spread across lines with different tax rates, the two approaches diverge, and only the discount-first order is defensible.",
      },
      { type: "h2", text: "Multiple taxes on one line" },
      {
        type: "p",
        text: "Where a combined rate is split into components — CGST 9% plus SGST 9% — each component is calculated on the same taxable value and shown separately. For inclusive pricing the combined rate is extracted once and then apportioned between the components by their share of the rate, so the components always sum exactly to the tax contained in the price.",
      },
      { type: "h2", text: "Rounding: why invoices fail to add up" },
      {
        type: "p",
        text: "If you carry full precision through every calculation and round only the final total, the printed rows can add up to a figure one cent away from the printed total. Customers notice. The fix is to round each amount to the currency's precision as it is produced, then build the totals from those rounded numbers — so the invoice adds up exactly as printed. That is how this generator calculates.",
      },
      {
        type: "cta",
        href: "/tax-invoice-generator",
        label: "Open the tax invoice generator",
        text: "Define any tax by name and rate, inclusive or exclusive, and see the breakdown update as you type.",
      },
    ],
    faqs: [
      {
        question: "Should tax be calculated before or after a discount?",
        answer:
          "After. Tax applies to the amount actually payable, so the discount reduces the taxable value first.",
      },
      {
        question: "How do I show tax if my prices already include it?",
        answer:
          "Mark the tax as inclusive. The invoice then shows the taxable value and the tax contained in the price separately, while the total stays the price you advertised.",
      },
    ],
    related: [
      { href: "/guides/invoice-discount-calculation", label: "How invoice discounts are calculated" },
      { href: "/gst-invoice-generator", label: "GST invoice generator" },
      { href: "/tax-invoice-generator", label: "Tax invoice generator" },
    ],
  },
  {
    slug: "invoice-discount-calculation",
    title: "How invoice discounts are calculated",
    seoTitle: "How to Calculate a Discount on an Invoice (with Examples)",
    description:
      "Percentage vs fixed discounts, line-level vs invoice-level, how they interact with tax, and how to show them so the invoice still adds up.",
    answer:
      "A line-level discount reduces a single item's amount before tax; an invoice-level discount reduces the whole subtotal and is spread proportionally across the lines. Both must be applied before tax is calculated. Show the discount as its own line on the invoice so the customer can see what they were given.",
    publishedAt: "2026-03-28",
    readingMinutes: 5,
    category: "Tax",
    blocks: [
      { type: "h2", text: "Line-level vs invoice-level" },
      {
        type: "p",
        text: "A line-level discount belongs to one item — a bulk price on one product, a goodwill reduction on one service. An invoice-level discount applies to the whole bill, such as a 10% loyalty discount across everything.",
      },
      {
        type: "p",
        text: "The distinction matters once tax is involved. An invoice-level discount has to be allocated back across the lines in proportion to their value, because different lines may carry different tax rates. Applying it as a lump sum after tax would produce a tax figure that does not match any line.",
      },
      {
        type: "table",
        headers: ["", "Line A", "Line B", "Total"],
        rows: [
          ["Amount", "100.00", "300.00", "400.00"],
          ["Share of 10% invoice discount", "10.00", "30.00", "40.00"],
          ["Taxable value", "90.00", "270.00", "360.00"],
        ],
      },
      { type: "h2", text: "Percentage vs fixed" },
      {
        type: "p",
        text: "A percentage discount scales with the amount; a fixed discount does not. Use fixed for a negotiated round-number reduction, and percentage for anything volume- or relationship-based. A fixed discount should never exceed the line or subtotal it applies to — a well-behaved invoice tool clamps it rather than producing a negative charge.",
      },
      { type: "h2", text: "Show the discount, do not bury it" },
      {
        type: "p",
        text: "Reducing the unit price silently hides the concession you made. Showing the full price and a separate discount line makes the value visible, which matters both commercially and when the customer compares the invoice against the quote.",
      },
      {
        type: "cta",
        href: "/invoice-generator",
        label: "Try it in the generator",
        text: "Add a line discount or an invoice discount and watch the taxable base and tax update as you type.",
      },
    ],
    related: [
      { href: "/guides/invoice-tax-calculation", label: "How invoice tax is calculated" },
      { href: "/guides/how-to-create-an-invoice", label: "How to create an invoice" },
    ],
  },
  {
    slug: "how-to-follow-up-on-unpaid-invoices",
    title: "How to follow up on unpaid invoices",
    seoTitle: "How to Follow Up on Unpaid Invoices (Templates and Timeline)",
    description:
      "A practical follow-up sequence for late invoices — when to chase, what to say, and how to escalate without damaging the relationship.",
    answer:
      "Follow up the day after an invoice becomes overdue, not a week later, and keep the first message short and factual. Escalate on a predictable schedule — a reminder at day 1, a firmer note at day 7, a call at day 14, and a formal demand at day 30 — and always send to accounts payable as well as your contact.",
    publishedAt: "2026-04-10",
    readingMinutes: 6,
    category: "Getting paid",
    blocks: [
      { type: "h2", text: "Before it is late" },
      {
        type: "p",
        text: "A short note a few days before the due date prevents more late payments than any amount of chasing afterwards. It is not a chase — it is a reminder that the invoice exists and that nothing is blocking it, which is exactly when a missing PO number or a wrong email address surfaces.",
      },
      { type: "h2", text: "A follow-up timeline that works" },
      {
        type: "table",
        headers: ["When", "Action", "Tone"],
        rows: [
          ["3 days before due", "Friendly reminder, re-attach the invoice", "Neutral, helpful"],
          ["Day 1 overdue", "Short note: invoice is now overdue, re-attached", "Factual"],
          ["Day 7", "Ask directly when payment will be made", "Firm, still warm"],
          ["Day 14", "Phone call, then confirm in writing", "Direct"],
          ["Day 30", "Formal demand, reference terms and any late fee", "Formal"],
        ],
      },
      { type: "h2", text: "What to say" },
      {
        type: "p",
        text: "Keep it under five sentences. State the invoice number, the amount, the due date, and ask a specific question — “Can you confirm the payment date?” is harder to ignore than “Just checking in”. Always re-attach the invoice: the single most common reason for non-payment is that nobody can find it.",
      },
      {
        type: "callout",
        text: "Do not apologise for asking. A neutral, matter-of-fact message reads as professional; an apologetic one signals that the deadline was optional.",
      },
      { type: "h2", text: "When it keeps happening" },
      {
        type: "ul",
        items: [
          "Shorten the terms for that client on the next engagement.",
          "Ask for a deposit before starting work.",
          "Invoice in stages rather than on completion, so exposure never accumulates.",
          "Confirm the AP contact and PO process before you start, not after the invoice is late.",
        ],
      },
      {
        type: "cta",
        href: "/guides/invoice-payment-terms",
        label: "Read about payment terms",
        text: "Most chronic late payment is a terms problem, not a chasing problem.",
      },
    ],
    related: [
      { href: "/guides/invoice-payment-terms", label: "Invoice payment terms explained" },
      { href: "/guides/how-to-create-an-invoice", label: "How to create an invoice" },
    ],
  },
  {
    slug: "gst-invoice-format",
    title: "GST invoice format explained",
    seoTitle: "GST Invoice Format: Required Fields, HSN/SAC and Tax Splits",
    description:
      "What a GST invoice must contain, when to use CGST/SGST vs IGST, how HSN and SAC codes work, and how the tax breakdown should appear.",
    answer:
      "A GST invoice must carry both parties' GSTINs, a consecutive invoice number and date, an HSN or SAC code per line, the taxable value after discount, and the tax shown by component — CGST and SGST for intra-state supply, or IGST for inter-state supply. The total is conventionally rounded to the nearest rupee and repeated in words.",
    publishedAt: "2026-04-24",
    updatedAt: "2026-09-05",
    readingMinutes: 7,
    category: "Tax",
    blocks: [
      { type: "h2", text: "Required fields" },
      {
        type: "ul",
        items: [
          "Supplier name, address and GSTIN.",
          "A consecutive invoice number, unique within the financial year, and the date of issue.",
          "Recipient name, address and GSTIN where they are registered.",
          "HSN code for goods, or SAC code for services, per line item.",
          "Description, quantity and unit for each line.",
          "Taxable value after any discount.",
          "Rate and amount of tax, shown per component.",
          "Place of supply, and the delivery address where it differs.",
          "Whether tax is payable on reverse charge.",
          "Signature or digital signature of the supplier.",
        ],
      },
      { type: "h2", text: "CGST + SGST or IGST?" },
      {
        type: "p",
        text: "This is determined by the place of supply, not by where your customer's head office is. If the supply is within the same state as the supplier, the combined rate splits into CGST and SGST at half each — an 18% supply becomes 9% CGST plus 9% SGST. If the supply crosses state lines, a single IGST at the full 18% applies instead.",
      },
      {
        type: "table",
        headers: ["Supply", "Tax charged", "Example at 18%"],
        rows: [
          ["Within the same state", "CGST + SGST", "9% + 9%"],
          ["Between states", "IGST", "18%"],
          ["Export / SEZ", "Usually zero-rated", "0% (conditions apply)"],
        ],
      },
      { type: "h2", text: "HSN and SAC codes" },
      {
        type: "p",
        text: "HSN codes classify goods and SAC codes classify services. The number of digits you must quote depends on your turnover — smaller businesses quote fewer digits. Use the code that matches what you actually supplied rather than a generic one; the code drives the rate.",
      },
      { type: "h2", text: "Rounding and amount in words" },
      {
        type: "p",
        text: "GST invoices conventionally round the final payable amount to the nearest rupee, showing the rounding adjustment as its own line so the arithmetic remains transparent. The total is then repeated in words beneath the totals block. Both are enabled by default on our GST generator.",
      },
      {
        type: "callout",
        text: "This is a practical formatting guide, not tax advice. Rates, HSN digit requirements and e-invoicing thresholds change — check the current rules for your turnover and state.",
      },
      {
        type: "cta",
        href: "/gst-invoice-generator",
        label: "Open the GST invoice generator",
        text: "HSN/SAC column, CGST/SGST and IGST presets, GSTIN fields, rounding and amount in words are all set up already.",
      },
    ],
    faqs: [
      {
        question: "When do I charge IGST instead of CGST and SGST?",
        answer:
          "When the place of supply is in a different state from the supplier. Intra-state supply is split into CGST and SGST; inter-state supply is charged as a single IGST at the full rate.",
      },
      {
        question: "Is HSN mandatory on a GST invoice?",
        answer:
          "Yes for most registered suppliers, though the number of digits required depends on turnover. Services use SAC codes instead.",
      },
    ],
    related: [
      { href: "/gst-invoice-generator", label: "GST invoice generator" },
      { href: "/guides/invoice-tax-calculation", label: "How invoice tax is calculated" },
      { href: "/invoice-examples/gst", label: "GST invoice example" },
    ],
  },
  {
    slug: "freelancer-invoice-guide",
    title: "The freelancer invoicing guide",
    seoTitle: "Freelance Invoicing Guide: Rates, Terms and Getting Paid",
    description:
      "How freelancers should invoice — what to include, how to bill hours vs projects, which terms to set, and how to handle deposits and late payers.",
    answer:
      "Freelancers should invoice immediately on delivery, bill hours or project fees as clearly described line items, state a specific due date rather than “on receipt”, and put payment details directly on the invoice. Ask for a deposit on larger projects, and keep invoice numbers sequential from the start.",
    publishedAt: "2026-05-08",
    readingMinutes: 8,
    category: "Getting paid",
    blocks: [
      { type: "h2", text: "Invoice the moment you deliver" },
      {
        type: "p",
        text: "Payment terms run from the invoice date, so batching invoices to month-end costs you up to a month of cash flow for no benefit. Send it the day the work lands.",
      },
      { type: "h2", text: "Hours or project fee?" },
      {
        type: "p",
        text: "Bill the way you priced. If you agreed an hourly rate, put the hours in the quantity field with the unit set to hrs — decimal hours work, so 7.5 bills correctly. If you agreed a project fee, one line with a clear description of the deliverable is better than an invented hour breakdown, which only invites scrutiny of how long things took.",
      },
      { type: "h2", text: "Deposits and staged payments" },
      {
        type: "p",
        text: "For anything substantial, invoice a deposit before starting — commonly 30–50%. Bill it as its own line describing what it covers. On the final invoice, add the deposit back as a negative line so the balance due is unambiguous.",
      },
      {
        type: "table",
        headers: ["Project size", "Suggested structure"],
        rows: [
          ["Under a week", "Invoice in full on delivery"],
          ["1–4 weeks", "50% deposit, 50% on delivery"],
          ["Over a month", "Deposit, then monthly or milestone invoices"],
          ["Ongoing", "Monthly retainer invoiced in advance"],
        ],
      },
      { type: "h2", text: "Terms that actually get honoured" },
      {
        type: "p",
        text: "Net 14 is a reasonable default for freelance work and is rarely challenged. Put a specific due date on the invoice as well as the terms in words, and include your payment details on the document itself rather than in the covering email — emails get forwarded without attachments, and invoices get filed without emails.",
      },
      { type: "h2", text: "Keep your details ready" },
      {
        type: "p",
        text: "Your business details, logo and payment information persist in your browser here, so each new invoice starts mostly filled in. That removes the main reason freelancers delay invoicing — the friction of starting the document.",
      },
      {
        type: "cta",
        href: "/freelance-invoice-generator",
        label: "Open the freelancer invoice generator",
        text: "Set up for hourly and project billing, with payment details and terms on the document.",
      },
    ],
    faqs: [
      {
        question: "Should a freelancer charge a deposit?",
        answer:
          "For anything longer than about a week, yes. A 30–50% deposit covers your exposure and filters out clients who were never going to pay.",
      },
      {
        question: "What payment terms should a freelancer use?",
        answer:
          "Net 14 is a good default — short enough to protect cash flow, standard enough that clients rarely push back.",
      },
    ],
    related: [
      { href: "/freelance-invoice-generator", label: "Freelancer invoice generator" },
      { href: "/invoice-examples/freelancer", label: "Freelancer invoice example" },
      { href: "/guides/invoice-payment-terms", label: "Invoice payment terms explained" },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
