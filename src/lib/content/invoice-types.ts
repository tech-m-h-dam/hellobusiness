/**
 * Invoice-type landing pages (spec section 24).
 *
 * Each entry is a page that exists because that audience genuinely needs
 * something different — different fields on the document, different default
 * columns, different template, and different questions answered. Pages that
 * would only differ by swapping a keyword are deliberately *not* here; those
 * URLs redirect to the canonical tool page instead (see next.config.ts).
 *
 * Content lives as data so it can move to the CMS later without touching the
 * route component.
 */
import type { InvoiceMeta, InvoiceSettings } from "@/lib/invoice/types";

export type InvoiceTypeContent = {
  slug: string;
  h1: string;
  title: string;
  description: string;
  /** 2–4 sentence direct answer, rendered first for answer engines (spec 33). */
  intro: string;
  /** What genuinely differs for this audience. */
  highlights: { heading: string; body: string }[];
  /** Section bodies rendered as long-form content. */
  sections: { heading: string; body: string[] }[];
  faqs: { question: string; answer: string }[];
  templateId: string;
  settings: Partial<InvoiceSettings>;
  /**
   * Invoice defaults for this type — currency, locale, document title. A GST
   * invoice in dollars is wrong out of the box, so the page that exists for
   * GST should start in rupees.
   */
  meta?: Partial<InvoiceMeta>;
  relatedTemplates: string[];
  relatedGuides: { href: string; label: string }[];
  relatedExample?: string;
};

const gstSettings: Partial<InvoiceSettings> = {
  showColumn: {
    index: true, image: false, name: true, description: true, sku: false, hsn: true,
    quantity: true, unit: true, rate: true, discount: true, tax: true, amount: true,
  },
  showTaxSummary: true,
  roundTotal: true,
};

export const INVOICE_TYPES: InvoiceTypeContent[] = [
  {
    slug: "gst-invoice-generator",
    h1: "GST Invoice Generator",
    title: "GST Invoice Generator — Free GST Invoice Format with HSN/SAC",
    description:
      "Create a GST-compliant invoice free. CGST/SGST or IGST split, HSN/SAC codes, GSTIN for both parties, tax summary and amount in words. Download PDF, no signup.",
    intro:
      "A GST invoice is a tax invoice that carries the GSTIN of both parties, an HSN or SAC code for every line, and a tax breakdown showing CGST and SGST separately for intra-state supply or IGST for inter-state supply. This generator sets up those fields and columns for you, calculates the splits, and downloads a PDF — free, with no signup.",
    highlights: [
      {
        heading: "CGST + SGST or IGST",
        body: "Apply an 18% GST as a single line, or split it into CGST 9% + SGST 9% with one preset. Inter-state supply uses IGST at the full rate. Each tax appears as its own line in the summary, which is what a GST invoice is required to show.",
      },
      {
        heading: "HSN / SAC column",
        body: "The HSN (goods) and SAC (services) column is switched on by default on this page, and every line item has a field for it.",
      },
      {
        heading: "GSTIN for both parties",
        body: "Your GSTIN appears in the business block and your customer's in the bill-to block, both printed on the document.",
      },
      {
        heading: "Amount in words and rounding",
        body: "The total is spelled out in words beneath the totals block, and total rounding to the nearest rupee is enabled by default, shown as its own rounding line.",
      },
    ],
    sections: [
      {
        heading: "What a GST invoice must contain",
        body: [
          "Indian GST rules expect a tax invoice to identify both parties and the supply precisely enough to be matched against a return. In practice that means: the supplier's name, address and GSTIN; a consecutive invoice number and date; the recipient's name, address and GSTIN where they are registered; the HSN or SAC code; a description, quantity and unit for each item; the taxable value after any discount; the rate and amount of each tax; and the place of supply.",
          "The distinction that trips people up most often is intra-state versus inter-state. When the supplier and the place of supply are in the same state, the tax is split into CGST and SGST at half the combined rate each. When they are in different states, a single IGST at the full rate applies instead. This generator does not guess which applies to you — pick the preset that matches your supply and the calculation follows from it.",
        ],
      },
      {
        heading: "How tax is calculated on a discounted line",
        body: [
          "Tax is charged on the value after discount, not before it. If you sell an item at ₹1,000 with a 10% line discount, the taxable value is ₹900 and 18% GST on that is ₹162 — not ₹180. Our calculation engine applies both line-level and invoice-level discounts to the taxable base before computing any tax, so the figures on the document are the ones you would defend in a return.",
          "If your prices already include GST, mark the tax as inclusive. The engine then extracts the tax contained in the price rather than adding it on top, so a ₹1,180 inclusive line shows a ₹1,000 taxable value and ₹180 tax, and the total stays ₹1,180.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is this GST invoice generator free?",
        answer:
          "Yes — unlimited GST invoices, no signup, no watermark, and PDF download included.",
      },
      {
        question: "Does it split CGST and SGST automatically?",
        answer:
          "Choose the 'GST 18% split — CGST 9% + SGST 9%' preset and both taxes are created and applied to every line, each shown separately in the tax summary. For inter-state supply, choose the IGST preset instead.",
      },
      {
        question: "Can I add HSN and SAC codes?",
        answer:
          "Yes. The HSN/SAC column is enabled by default on this page, and each line item has its own HSN/SAC field.",
      },
      {
        question: "Does it support GST-inclusive pricing?",
        answer:
          "Yes. Mark a tax as inclusive and the tax contained in your price is extracted rather than added, so the line total stays the price you quoted.",
      },
      {
        question: "Is my GST invoice data sent to your servers?",
        answer:
          "No. Everything — the GSTIN you type, the line items, the totals and the PDF — is handled in your browser and stored only there unless you sign in and explicitly save to your account.",
      },
    ],
    templateId: "gst-classic",
    settings: gstSettings,
    meta: { currency: "INR", locale: "en-IN", documentTitle: "Tax Invoice" },
    relatedTemplates: ["gst-classic", "gst-modern", "professional"],
    relatedGuides: [
      { href: "/guides/gst-invoice-format", label: "GST invoice format explained" },
      { href: "/guides/invoice-tax-calculation", label: "How invoice tax is calculated" },
    ],
    relatedExample: "gst",
  },
  {
    slug: "tax-invoice-generator",
    h1: "Tax Invoice Generator",
    title: "Tax Invoice Generator — Free Tax Invoice with VAT, GST or Sales Tax",
    description:
      "Create a tax invoice free with any tax you define — VAT, GST, sales tax or custom. Inclusive or exclusive, multiple rates, full tax breakdown. Download PDF instantly.",
    intro:
      "A tax invoice is an invoice that states the tax charged on a sale separately from the amount before tax, so the buyer can reclaim or account for it. This generator lets you define any tax by name and rate — VAT, GST, sales tax or your own — charge it inclusive or exclusive of your prices, and print a clear breakdown. Free, no signup.",
    highlights: [
      {
        heading: "Any tax, any rate",
        body: "Nothing here is hardcoded to one country. Name the tax whatever your jurisdiction calls it, set a percentage or a fixed amount, and apply it per line item.",
      },
      {
        heading: "Inclusive or exclusive",
        body: "Charge tax on top of your prices, or mark it inclusive and have the tax contained in the price extracted — the arithmetic is exact either way, with no residual cent.",
      },
      {
        heading: "Multiple taxes at once",
        body: "Apply more than one tax to the same line — a state and a federal tax, or a split like CGST and SGST — and each appears separately in the summary.",
      },
      {
        heading: "Tax-exempt lines",
        body: "Taxes are applied per line item, so zero-rated and exempt items simply have no tax attached while the rest of the invoice is taxed normally.",
      },
    ],
    sections: [
      {
        heading: "Tax invoice vs a plain invoice",
        body: [
          "Every tax invoice is an invoice, but not every invoice is a tax invoice. The difference is that a tax invoice states the tax as a separate, identifiable amount — the taxable value, the rate applied, and the tax charged — because the buyer usually needs those numbers to reclaim the tax or to account for it. A plain invoice may simply state a total.",
          "If you are registered for VAT, GST or an equivalent, the invoices you issue for taxable supplies generally need to be tax invoices, and the registration number of both parties is usually required. Enter yours in the business section and your customer's in the bill-to section and both print on the document.",
        ],
      },
      {
        heading: "Inclusive vs exclusive tax, with worked numbers",
        body: [
          "Exclusive is the common B2B case: a £100 line with 20% VAT exclusive shows a £100 taxable value, £20 tax, and a £120 total. The customer sees exactly what was added.",
          "Inclusive is the common consumer case: a £120 line with 20% VAT inclusive shows an £100 taxable value, £20 tax, and a £120 total — the price you advertised is the price paid, and the tax is disclosed as the portion contained within it. We derive the tax as gross minus net rather than as a percentage of gross, which is why the parts always sum back to the price exactly.",
        ],
      },
    ],
    faqs: [
      {
        question: "What makes an invoice a tax invoice?",
        answer:
          "It states the tax separately — the value before tax, the rate, and the tax amount — rather than only a total, and normally carries the tax registration number of the supplier.",
      },
      {
        question: "Can I charge two different taxes on one invoice?",
        answer:
          "Yes. Define as many taxes as you need and apply any combination to each line item. Each one is totalled separately in the tax summary.",
      },
      {
        question: "Can I make some items tax-free?",
        answer:
          "Yes. Tax is applied per line, so leave the tax off any zero-rated or exempt item and the rest of the invoice is unaffected.",
      },
      {
        question: "Does it handle tax-inclusive pricing correctly?",
        answer:
          "Yes. Inclusive tax is extracted from the price as gross minus net, so the taxable value and tax always add back to exactly the price you charged, with no rounding drift.",
      },
    ],
    templateId: "professional",
    settings: { showTaxSummary: true },
    meta: { documentTitle: "Tax Invoice" },
    relatedTemplates: ["professional", "classic-navy", "corporate"],
    relatedGuides: [
      { href: "/guides/invoice-tax-calculation", label: "How invoice tax is calculated" },
      { href: "/guides/invoice-vs-receipt", label: "Invoice vs receipt" },
    ],
    relatedExample: "gst",
  },
  {
    slug: "freelance-invoice-generator",
    h1: "Freelancer Invoice Generator",
    title: "Freelancer Invoice Generator — Free Invoice Maker for Freelancers",
    description:
      "Create a freelance invoice free. Bill by the hour or project, add your logo, set payment terms and download a professional PDF — no signup, no watermark.",
    intro:
      "A freelance invoice bills a client for your time or a completed project, and needs to make three things obvious: what you did, what it costs, and how to pay you. This generator is set up for exactly that — hourly or fixed-fee lines, a clear due date, and your payment details on the document. Free, with no account required.",
    highlights: [
      {
        heading: "Hourly or fixed fee",
        body: "Set the unit to 'hrs' and the quantity to your hours, or use a single line for a project fee. Decimal quantities work, so 7.5 hours bills correctly.",
      },
      {
        heading: "Payment details front and centre",
        body: "Bank details, a payment link or a UPI QR code print on the invoice, so a client never has to email you asking how to pay.",
      },
      {
        heading: "Payment terms and due date",
        body: "A stated due date and terms line makes late payment unambiguous — the single most effective thing a freelancer can put on an invoice.",
      },
      {
        heading: "Reusable across clients",
        body: "Your business details and logo stay in this browser, so the next invoice starts already filled in.",
      },
    ],
    sections: [
      {
        heading: "What to put on a freelance invoice",
        body: [
          "Keep the line items specific enough that your client's finance team can approve them without asking you a question. 'Design work — 12 hours' is weaker than 'Landing page design, 12 hours @ £65' with the project name in a custom field. Specificity gets invoices paid faster, because it removes the reason to put yours aside.",
          "Add your payment terms explicitly rather than relying on convention. 'Due within 14 days' plus a dated due date on the document gives you a clear position if you need to chase, and most clients simply pay to the date they are shown.",
        ],
      },
      {
        heading: "Getting paid on time",
        body: [
          "Invoice immediately on delivery rather than at month end — the clock starts when the invoice arrives, not when the work finished. Send it to the person who processes payments, not only to your day-to-day contact, and put a PO or project reference on it if your client uses them (add one as a custom field).",
          "If you work with the same clients repeatedly, keep your invoice numbering sequential and predictable. It looks established, and it makes your own records easy to reconcile at year end.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need to register a business to invoice a client?",
        answer:
          "Requirements vary by country, and this isn't tax advice — but as a practical matter, most freelancers invoice under their own name and tax number until they incorporate. The generator supports either: put whatever trading name and tax ID applies to you in the business section.",
      },
      {
        question: "How do I bill hours on an invoice?",
        answer:
          "Put your hours in the quantity field, set the unit to 'hrs' and your hourly rate in the rate field. Decimal hours such as 7.5 calculate correctly.",
      },
      {
        question: "Can I invoice in a different currency to my own?",
        answer:
          "Yes. Pick any supported currency and the amounts, symbol and formatting follow it. Note the generator does not convert between currencies — enter the rate you're billing in.",
      },
      {
        question: "Can I save my details so the next invoice is faster?",
        answer:
          "Yes. Your business details and logo persist in this browser automatically. Signing in with Google additionally lets you save whole invoices to your account and open them on another device.",
      },
    ],
    templateId: "freelancer",
    settings: {
      showColumn: {
        index: true, image: false, name: true, description: true, sku: false, hsn: false,
        quantity: true, unit: true, rate: true, discount: false, tax: false, amount: true,
      },
    },
    relatedTemplates: ["freelancer", "minimal", "service"],
    relatedGuides: [
      { href: "/guides/freelancer-invoice-guide", label: "The freelancer invoicing guide" },
      { href: "/guides/invoice-payment-terms", label: "Invoice payment terms explained" },
    ],
    relatedExample: "freelancer",
  },
  {
    slug: "service-invoice-generator",
    h1: "Service Invoice Generator",
    title: "Service Invoice Generator — Free Invoice for Services Rendered",
    description:
      "Create a service invoice free. Describe the work, bill by hour or job, cover a service period, add terms and download a professional PDF. No signup required.",
    intro:
      "A service invoice bills for work performed rather than goods delivered, so the description carries the weight: what was done, over what period, at what rate. This generator gives every line a full description field and a service-period custom field, and prints a clean document your client can approve quickly. Free, no signup.",
    highlights: [
      {
        heading: "Description-led line items",
        body: "Each line has a multi-line description under the item name, so you can spell out scope without cramming it into a title.",
      },
      {
        heading: "Service period",
        body: "Add a service period as a custom field — 'Services rendered 1–31 March' — which is what most clients' finance teams look for first.",
      },
      {
        heading: "Hourly, daily or per job",
        body: "Set the unit to hrs, days or job and bill however you priced the work. Decimal quantities are supported.",
      },
      {
        heading: "SAC codes when needed",
        body: "If you invoice services under Indian GST, turn on the HSN/SAC column and enter your SAC code per line.",
      },
    ],
    sections: [
      {
        heading: "Writing service line items that get approved",
        body: [
          "The person approving your invoice is often not the person who hired you. Write each line so it stands on its own: name the deliverable, the period it covers and the basis of the charge. 'Monthly retainer — social media management, March 2026' needs no follow-up question; 'Consulting' does.",
          "Where a job ran over several stages, use one line per stage rather than a single lump sum. It reads as a considered bill rather than a round number, and if one stage is queried the rest can still be paid.",
        ],
      },
      {
        heading: "Deposits, retainers and partial billing",
        body: [
          "For a deposit, invoice the deposit amount as its own line with a description that says so, then reference it on the final invoice as a negative line — the calculation engine handles negative amounts correctly, so the balance comes out right.",
          "For a retainer, a single recurring line with the period in the description is usually enough. Keep the invoice number sequential month to month so the series is easy to follow.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is a service invoice?",
        answer:
          "An invoice for work performed rather than physical goods — consulting, maintenance, design, repairs, professional services. It emphasises a description of the work and the period covered rather than quantities and SKUs.",
      },
      {
        question: "How do I show the service period?",
        answer:
          "Add a custom field labelled 'Service period' in the invoice details section, or put the dates in each line item's description if different lines cover different periods.",
      },
      {
        question: "Can I bill a deposit and deduct it later?",
        answer:
          "Yes. Invoice the deposit as its own line, then on the final invoice add a negative line for the amount already paid. Negative amounts calculate correctly, including with tax.",
      },
    ],
    templateId: "service",
    settings: {
      showColumn: {
        index: true, image: false, name: true, description: true, sku: false, hsn: false,
        quantity: true, unit: true, rate: true, discount: false, tax: true, amount: true,
      },
    },
    relatedTemplates: ["service", "consulting", "professional"],
    relatedGuides: [
      { href: "/guides/what-should-an-invoice-include", label: "What an invoice should include" },
      { href: "/guides/invoice-payment-terms", label: "Invoice payment terms explained" },
    ],
    relatedExample: "service",
  },
  {
    slug: "sales-invoice-generator",
    h1: "Sales Invoice Generator",
    title: "Sales Invoice Generator — Free Invoice for Product Sales",
    description:
      "Create a sales invoice free. SKU and product image columns, quantities, discounts, shipping and tax, with a printable PDF download. No signup required.",
    intro:
      "A sales invoice bills for goods sold, so it needs quantities, unit prices, product identifiers and usually shipping. This generator turns on the SKU and image columns, handles shipping as a taxable or non-taxable charge, and gives you a separate delivery address when goods ship elsewhere. Free, with PDF download.",
    highlights: [
      {
        heading: "SKU and product images",
        body: "The SKU column and per-item images are enabled here, so the buyer can match lines against what physically arrived.",
      },
      {
        heading: "Shipping and handling",
        body: "Add shipping as a fixed or percentage charge, and mark it taxable or not — tax on shipping varies by jurisdiction, so it's yours to set.",
      },
      {
        heading: "Separate delivery address",
        body: "Turn on 'ship to a different address' when goods go somewhere other than the billing address.",
      },
      {
        heading: "Quantity discounts",
        body: "Apply a percentage or fixed discount per line, or one discount across the whole invoice, spread proportionally before tax.",
      },
    ],
    sections: [
      {
        heading: "Product lines that reconcile cleanly",
        body: [
          "Give every line a SKU that matches your own catalogue. When a customer queries an order or returns an item, the SKU is what makes the conversation short. Product images help more than people expect on invoices for variable goods — furniture, parts, apparel — because the buyer can confirm at a glance that the right variant was sent.",
          "Keep units explicit. 'Qty 12' means something different for boxes than for individual pieces; setting the unit to 'box' or 'pcs' removes an entire class of dispute.",
        ],
      },
      {
        heading: "Shipping, tax and discounts together",
        body: [
          "When an invoice carries both a discount and tax, the order of operations matters. This generator applies discounts to the taxable base before calculating tax, which is what tax authorities generally require — otherwise you would overstate the tax due and overcharge your customer.",
          "Shipping is handled as a charge rather than a line item so it sits below the subtotal where buyers expect it, and you choose explicitly whether tax applies to it.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I add product photos to a sales invoice?",
        answer:
          "Yes. Each line item accepts one or more images, shown as a thumbnail, a large image, a gallery or a product card. Images are resized in your browser and embedded in the PDF.",
      },
      {
        question: "How do I add shipping?",
        answer:
          "Add it as a charge in the Tax section. Set it as a fixed amount or a percentage, and toggle whether your taxes apply to it.",
      },
      {
        question: "Can the delivery address differ from the billing address?",
        answer:
          "Yes. Enable 'ship to a different address' in the customer section and a separate Ship To block appears on the invoice.",
      },
    ],
    templateId: "retail",
    settings: {
      showColumn: {
        index: true, image: true, name: true, description: true, sku: true, hsn: false,
        quantity: true, unit: true, rate: true, discount: true, tax: true, amount: true,
      },
      showShipping: true,
    },
    relatedTemplates: ["retail", "product", "modern"],
    relatedGuides: [
      { href: "/guides/invoice-discount-calculation", label: "How invoice discounts are calculated" },
      { href: "/guides/what-should-an-invoice-include", label: "What an invoice should include" },
    ],
    relatedExample: "sales",
  },
  {
    slug: "consultant-invoice-generator",
    h1: "Consultant Invoice Generator",
    title: "Consultant Invoice Generator — Free Consulting Invoice Template",
    description:
      "Create a consulting invoice free. Bill retainers, day rates or hourly engagements, add a PO number and terms, and download a polished PDF. No signup.",
    intro:
      "A consulting invoice usually bills against an agreed engagement — a retainer, a day rate or a block of hours — and often has to quote a purchase order number to be paid. This generator sets up a restrained, professional layout with PO and reference fields and a clear terms line. Free, no account needed.",
    highlights: [
      {
        heading: "PO number and reference",
        body: "Dedicated PO and reference fields print in the invoice header, which is usually what unblocks payment at larger clients.",
      },
      {
        heading: "Day rates and retainers",
        body: "Set the unit to 'days' or bill a single retainer line per period — both read cleanly in this layout.",
      },
      {
        heading: "Understated, senior design",
        body: "The consulting preset uses a serif face and a restrained sidebar rather than a bold colour band.",
      },
      {
        heading: "Engagement details",
        body: "Add custom fields for the engagement name, contract number or statement of work reference.",
      },
    ],
    sections: [
      {
        heading: "Invoicing corporate clients",
        body: [
          "Large organisations pay against references, not relationships. If your client issued a purchase order, put the number on the invoice — an invoice without it will often sit unpaid without anyone telling you why. The same applies to a contract or SOW number where one exists; add it as a custom field.",
          "Send to accounts payable as well as your sponsor. Your sponsor approves the work; AP schedules the payment, and they are rarely the same inbox.",
        ],
      },
      {
        heading: "Retainers and phased engagements",
        body: [
          "For a monthly retainer, one line describing the period and the scope is cleaner than itemising activities — you agreed a fee for availability and outcomes, not a timesheet. Keep the wording identical month to month so the series is obviously a retainer.",
          "For phased work, invoice per milestone with the milestone named in the line description. If a later phase slips, earlier invoices are already settled and the relationship stays comfortable.",
        ],
      },
    ],
    faqs: [
      {
        question: "Where do I put a purchase order number?",
        answer:
          "There is a PO number field in the invoice details section; it prints in the invoice header block alongside the number and date.",
      },
      {
        question: "Should I itemise a retainer?",
        answer:
          "Usually not. A single line naming the period and scope reflects what was agreed. Itemise only if your client's process specifically requires an activity breakdown.",
      },
      {
        question: "Can I add a contract or SOW reference?",
        answer:
          "Yes — add a custom field with whatever label your client uses, and it prints on the document.",
      },
    ],
    templateId: "consulting",
    settings: {
      showColumn: {
        index: true, image: false, name: true, description: true, sku: false, hsn: false,
        quantity: true, unit: true, rate: true, discount: false, tax: true, amount: true,
      },
    },
    relatedTemplates: ["consulting", "corporate", "classic-navy"],
    relatedGuides: [
      { href: "/guides/invoice-payment-terms", label: "Invoice payment terms explained" },
      { href: "/guides/how-to-follow-up-on-unpaid-invoices", label: "Following up on unpaid invoices" },
    ],
    relatedExample: "consultant",
  },
  {
    slug: "contractor-invoice-generator",
    h1: "Contractor Invoice Generator",
    title: "Contractor Invoice Generator — Free Invoice for Trades & Construction",
    description:
      "Create a contractor invoice free. Bill labour and materials, reference the site and job number, add retention and download a printable PDF. No signup.",
    intro:
      "A contractor invoice typically bills labour and materials against a specific job or site, and needs to reference the job number so it can be matched to the right cost code. This generator gives you a high-contrast layout with room for site references, and handles labour, materials and charges on the same document. Free to use.",
    highlights: [
      {
        heading: "Labour and materials together",
        body: "Bill hours at a labour rate and materials at cost or with a markup, each as their own lines with units that make sense.",
      },
      {
        heading: "Job and site references",
        body: "Add the job number, site address or work order as custom fields so the invoice reaches the right cost code.",
      },
      {
        heading: "Photos of completed work",
        body: "Attach images to line items — before-and-after photos attached to the relevant line settle variation queries quickly.",
      },
      {
        heading: "Rugged, legible layout",
        body: "The construction preset uses strong contrast and a clear table, which survives being printed and handled on site.",
      },
    ],
    sections: [
      {
        heading: "Billing labour and materials",
        body: [
          "Separate labour from materials rather than quoting one combined figure. Clients accept a materials line at cost far more readily than a single number they cannot decompose, and if a variation is disputed you can isolate it.",
          "Use units deliberately: hours for labour, and the actual purchase unit for materials — metres, sheets, bags. A line reading '14 bags @ £6.20' is self-evidently correct in a way that '1 materials @ £86.80' is not.",
        ],
      },
      {
        heading: "Variations and retention",
        body: [
          "Bill variations as clearly-labelled separate lines referencing the instruction that authorised them. Attaching a photo to that line is the fastest way to close out a query.",
          "Where a contract holds retention, show it as a negative line or an invoice-level discount so the invoice arrives at the amount actually payable now, and note the retained amount in the invoice notes.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I put photos of the work on the invoice?",
        answer:
          "Yes. Attach one or more images to any line item. They're resized in your browser and embedded directly in the PDF.",
      },
      {
        question: "How do I show a job or site reference?",
        answer:
          "Add custom fields for job number, site address or work order in the invoice details section — they print in the header area.",
      },
      {
        question: "How do I handle retention?",
        answer:
          "Add it as a negative line item or as an invoice-level discount so the total reflects what is payable now, and explain the retained amount in the notes.",
      },
    ],
    templateId: "construction",
    settings: {
      showColumn: {
        index: true, image: true, name: true, description: true, sku: false, hsn: false,
        quantity: true, unit: true, rate: true, discount: false, tax: true, amount: true,
      },
    },
    relatedTemplates: ["construction", "corporate", "professional"],
    relatedGuides: [
      { href: "/guides/what-should-an-invoice-include", label: "What an invoice should include" },
      { href: "/guides/how-to-follow-up-on-unpaid-invoices", label: "Following up on unpaid invoices" },
    ],
    relatedExample: "contractor",
  },
  {
    slug: "developer-invoice-generator",
    h1: "Developer Invoice Generator",
    title: "Developer Invoice Generator — Free Invoice for Software Work",
    description:
      "Create a software developer invoice free. Bill sprints, hourly work or milestones, reference tickets, and download a clean PDF. No signup required.",
    intro:
      "A developer invoice bills for engineering work — hourly, per sprint, or per milestone — and is easiest to approve when each line maps to something the client already recognises, like a sprint, an epic or a ticket reference. This generator is set up for that, with a minimal layout and description-led lines. Free, no signup.",
    highlights: [
      {
        heading: "Sprints, hours or milestones",
        body: "Bill however you contracted: hours at a rate, a fixed price per sprint, or milestone payments as separate lines.",
      },
      {
        heading: "Ticket and epic references",
        body: "Put issue references in each line's description so the client can trace a charge to work they've already reviewed.",
      },
      {
        heading: "Minimal, technical-looking layout",
        body: "A restrained monospace or sans layout that reads like an engineering document, not a marketing brochure.",
      },
      {
        heading: "Multi-currency",
        body: "Bill international clients in their currency — formatting, symbol and decimals follow the currency you choose.",
      },
    ],
    sections: [
      {
        heading: "Structuring a developer invoice",
        body: [
          "Map line items to units of work the client already has visibility into. If they run two-week sprints, one line per sprint with the sprint name and dates is immediately verifiable against their own board. If you work ticket by ticket, group by epic and list the ticket IDs in the description rather than listing forty separate lines.",
          "Where you bill hourly, keep the granularity honest but not exhausting — daily or weekly totals with a description of what was worked on is the level most clients want. A per-commit breakdown invites scrutiny of the wrong things.",
        ],
      },
      {
        heading: "Retainers, support and overage",
        body: [
          "For an ongoing support arrangement, invoice the retained amount as a fixed line and any overage as a separate hourly line. Showing them separately makes it obvious when the retainer is consistently being exceeded, which is the conversation you want to be having.",
          "If you carry infrastructure or third-party costs on the client's behalf, bill them as their own line at cost, and say so in the description. Mixing pass-through costs into your rate makes your rate look higher than it is.",
        ],
      },
    ],
    faqs: [
      {
        question: "How should I bill a sprint?",
        answer:
          "One line per sprint, naming the sprint and its dates, with either a fixed price or your hours at your rate. It matches how the client already tracks the work.",
      },
      {
        question: "Can I invoice a client in another currency?",
        answer:
          "Yes — choose any supported currency and all formatting follows it. The tool doesn't convert rates, so enter the amounts in the currency you're billing.",
      },
      {
        question: "Should I itemise pass-through costs?",
        answer:
          "Yes, as their own lines at cost with a clear description. It keeps your rate legible and avoids the appearance of a markup you're not charging.",
      },
    ],
    templateId: "minimal",
    settings: {
      showColumn: {
        index: true, image: false, name: true, description: true, sku: false, hsn: false,
        quantity: true, unit: true, rate: true, discount: false, tax: true, amount: true,
      },
    },
    relatedTemplates: ["minimal", "compact-mono", "freelancer"],
    relatedGuides: [
      { href: "/guides/freelancer-invoice-guide", label: "The freelancer invoicing guide" },
      { href: "/guides/invoice-numbering", label: "Invoice numbering that scales" },
    ],
    relatedExample: "developer",
  },
];

export function getInvoiceType(slug: string): InvoiceTypeContent | undefined {
  return INVOICE_TYPES.find((t) => t.slug === slug);
}

export const INVOICE_TYPE_SLUGS = INVOICE_TYPES.map((t) => t.slug);
