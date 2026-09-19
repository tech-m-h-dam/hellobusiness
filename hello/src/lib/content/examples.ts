/**
 * Worked invoice examples (spec section 25).
 *
 * Each example is a real, fully-populated `Invoice` object rendered through the
 * same document renderer as the live editor — not a screenshot and not mock
 * markup. That means an example can never drift from what the tool actually
 * produces, and "use this format" can load the exact invoice into the editor.
 */
import { createCharge, createInvoice, createLineItem, createTax, makeId } from "@/lib/invoice/defaults";
import type { Invoice } from "@/lib/invoice/types";

export type InvoiceExample = {
  slug: string;
  name: string;
  title: string;
  description: string;
  /** Direct answer paragraph shown before the example. */
  intro: string;
  /** What this example demonstrates that others don't. */
  notes: string[];
  /** Fields highlighted as important for this kind of invoice. */
  fieldsIncluded: string[];
  relatedTool: { href: string; label: string };
  relatedGuide: { href: string; label: string };
  build: () => Invoice;
};

/** Fixed dates so example pages render identically on every build (stable SSG output). */
const DATE = "2026-03-01";
const DUE = "2026-03-15";

function base(overrides: Partial<Invoice>): Invoice {
  const invoice = createInvoice(overrides);
  return {
    ...invoice,
    invoice: { ...invoice.invoice, date: DATE, dueDate: DUE, ...overrides.invoice },
    createdAt: `${DATE}T09:00:00.000Z`,
    updatedAt: `${DATE}T09:00:00.000Z`,
  };
}

export const EXAMPLES: InvoiceExample[] = [
  {
    slug: "freelancer",
    name: "Freelancer invoice example",
    title: "Freelance Invoice Example — Filled-In Sample You Can Copy",
    description:
      "A complete freelance invoice example showing hourly billing, a project reference, payment terms and bank details. Open it in the editor and make it yours.",
    intro:
      "This is a filled-in freelance invoice for a design project billed by the hour. It shows the three things that matter most on a freelance invoice: specific line descriptions, a stated due date, and payment details printed on the document itself.",
    notes: [
      "Hours are billed with the unit set to “hrs”, and decimal hours (7.5) calculate correctly.",
      "Each line names the deliverable rather than the discipline — “Landing page design” rather than “Design”.",
      "A project reference is carried as a custom field so the client can match it to their own tracking.",
      "No tax is applied, which is common for freelancers below a registration threshold.",
    ],
    fieldsIncluded: [
      "Business name, address and email",
      "Customer name and billing address",
      "Invoice number, date and due date",
      "Project reference (custom field)",
      "Line items with hours, rate and amount",
      "Payment terms and bank details",
      "Notes",
    ],
    relatedTool: { href: "/freelance-invoice-generator", label: "Freelancer invoice generator" },
    relatedGuide: { href: "/guides/freelancer-invoice-guide", label: "The freelancer invoicing guide" },
    build: () =>
      base({
        templateId: "freelancer",
        business: {
          name: "Maya Okafor Design",
          email: "maya@okafordesign.co",
          phone: "+44 7700 900142",
          addressLine1: "Studio 4, 18 Baltic Street",
          city: "Bristol",
          postalCode: "BS1 6TQ",
          country: "United Kingdom",
        },
        customer: {
          name: "Tom Alvarez",
          company: "Northwind Coffee Ltd",
          email: "accounts@northwindcoffee.co.uk",
          billingAddress: "22 Harbour Road\nBristol BS1 5TY\nUnited Kingdom",
        },
        invoice: {
          number: "INV-1042",
          date: DATE,
          dueDate: DUE,
          documentTitle: "Invoice",
          currency: "GBP",
          locale: "en-GB",
          paymentTerms: "Payment due within 14 days",
        },
        items: [
          createLineItem({ name: "Landing page design", description: "Homepage and product page, 2 revision rounds", quantity: 18, unit: "hrs", rate: 65 }),
          createLineItem({ name: "Brand asset pack", description: "Logo variations, colour and type specification", quantity: 7.5, unit: "hrs", rate: 65 }),
          createLineItem({ name: "Handover session", description: "Walkthrough and documentation", quantity: 1.5, unit: "hrs", rate: 65 }),
        ],
        customFields: [
          { id: makeId("field"), label: "Project", value: "Northwind site refresh", visible: true, section: "invoice" },
        ],
        payment: {
          bankName: "Monzo Bank",
          accountName: "Maya Okafor Design",
          accountNumber: "•••• 4471",
          ifsc: "04-00-04",
        },
        notes: "Thank you — it was a pleasure working on this.",
        settings: {
          ...createInvoice().settings,
          primaryColor: "#0891b2",
          showBankDetails: true,
          showColumn: {
            index: true, image: false, name: true, description: true, sku: false, hsn: false,
            quantity: true, unit: true, rate: true, discount: false, tax: false, amount: true,
          },
        },
      }),
  },
  {
    slug: "gst",
    name: "GST invoice example",
    title: "GST Invoice Example — CGST/SGST Format with HSN Codes",
    description:
      "A filled-in GST invoice example with GSTIN for both parties, HSN codes, a CGST and SGST split, rounding and the amount in words.",
    intro:
      "This is a GST-compliant tax invoice for an intra-state supply, so the 18% GST is split into CGST 9% and SGST 9%. It shows the HSN column, both parties' GSTINs, the tax breakdown by component, rounding to the nearest rupee and the total repeated in words.",
    notes: [
      "Intra-state supply, so the tax splits into CGST and SGST at half the combined rate each. For an inter-state supply this would instead be a single IGST at 18%.",
      "Every line carries an HSN code — SAC codes are used in place of HSN for services.",
      "The total is rounded to the nearest rupee and the rounding adjustment is shown as its own line.",
      "The amount in words appears beneath the totals, as is conventional on Indian tax invoices.",
    ],
    fieldsIncluded: [
      "Supplier GSTIN and address",
      "Recipient GSTIN and address",
      "Invoice number and date",
      "HSN code per line item",
      "Taxable value per line",
      "CGST and SGST shown separately",
      "Rounding adjustment",
      "Amount in words",
    ],
    relatedTool: { href: "/gst-invoice-generator", label: "GST invoice generator" },
    relatedGuide: { href: "/guides/gst-invoice-format", label: "GST invoice format explained" },
    build: () => {
      const cgst = createTax({ name: "CGST", rate: 9, inclusive: false });
      const sgst = createTax({ name: "SGST", rate: 9, inclusive: false });
      return base({
        templateId: "gst-classic",
        business: {
          name: "Suryodaya Electricals Pvt Ltd",
          email: "billing@suryodaya.in",
          phone: "+91 80 4123 8890",
          addressLine1: "44 Industrial Layout, Phase II",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560058",
          country: "India",
          gstin: "29ABCDE1234F1Z5",
        },
        customer: {
          name: "Rakesh Menon",
          company: "Greenfield Interiors",
          billingAddress: "17 MG Road\nBengaluru, Karnataka 560001",
          gstin: "29XYZAB5678K1Z2",
        },
        invoice: {
          number: "INV-2026-114",
          date: DATE,
          dueDate: DUE,
          documentTitle: "Tax Invoice",
          currency: "INR",
          locale: "en-IN",
          paymentTerms: "Payment due within 15 days",
        },
        taxes: [cgst, sgst],
        items: [
          createLineItem({ name: "LED panel light 24W", hsn: "9405", quantity: 40, unit: "pcs", rate: 1250, taxIds: [cgst.id, sgst.id] }),
          createLineItem({ name: "Copper wiring 2.5 sq mm", hsn: "8544", quantity: 12, unit: "rolls", rate: 2180, taxIds: [cgst.id, sgst.id] }),
          createLineItem({ name: "Installation service", hsn: "9987", description: "On-site installation and testing", quantity: 1, unit: "job", rate: 8500, taxIds: [cgst.id, sgst.id] }),
        ],
        settings: {
          ...createInvoice().settings,
          primaryColor: "#15803d",
          roundTotal: true,
          showTaxSummary: true,
          showColumn: {
            index: true, image: false, name: true, description: true, sku: false, hsn: true,
            quantity: true, unit: true, rate: true, discount: false, tax: true, amount: true,
          },
        },
      });
    },
  },
  {
    slug: "consultant",
    name: "Consultant invoice example",
    title: "Consulting Invoice Example — Day Rate with PO Number",
    description:
      "A consulting invoice example billing a day rate against a purchase order, with VAT, engagement reference and formal payment terms.",
    intro:
      "This is a consulting invoice billed at a day rate against a client purchase order. It shows the two things corporate clients require before they will pay: a PO number in the header and an engagement reference identifying the statement of work.",
    notes: [
      "The PO number prints in the invoice header — at most large organisations an invoice without it will not be scheduled for payment.",
      "Days are billed as the unit rather than hours, matching how the engagement was priced.",
      "VAT at 20% is applied exclusively, which is the usual B2B arrangement.",
      "Net 30 terms, which is standard for enterprise clients.",
    ],
    fieldsIncluded: [
      "Consultant business details and VAT number",
      "Client company and billing address",
      "Purchase order number",
      "Engagement reference (custom field)",
      "Day-rate line items",
      "VAT breakdown",
      "Net 30 payment terms",
    ],
    relatedTool: { href: "/consultant-invoice-generator", label: "Consultant invoice generator" },
    relatedGuide: { href: "/guides/invoice-payment-terms", label: "Invoice payment terms explained" },
    build: () => {
      const vat = createTax({ name: "VAT", rate: 20, inclusive: false });
      return base({
        templateId: "consulting",
        business: {
          name: "Aldridge Advisory Ltd",
          email: "invoices@aldridgeadvisory.com",
          addressLine1: "3rd Floor, 40 Gracechurch Street",
          city: "London",
          postalCode: "EC3V 0BT",
          country: "United Kingdom",
          taxId: "GB 412 8876 33",
        },
        customer: {
          name: "Accounts Payable",
          company: "Halden Manufacturing PLC",
          email: "ap@haldenmfg.com",
          billingAddress: "Halden House, Ridgeway Park\nSheffield S9 1TT\nUnited Kingdom",
          taxId: "GB 771 2245 09",
        },
        invoice: {
          number: "AA-2026-038",
          date: DATE,
          dueDate: "2026-03-31",
          documentTitle: "Invoice",
          currency: "GBP",
          locale: "en-GB",
          purchaseOrder: "PO-88421",
          paymentTerms: "Net 30",
        },
        taxes: [vat],
        items: [
          createLineItem({ name: "Operations diagnostic", description: "Phase 1 — process mapping and interviews", quantity: 6, unit: "days", rate: 1450, taxIds: [vat.id] }),
          createLineItem({ name: "Executive workshop", description: "Facilitation and findings presentation", quantity: 1, unit: "days", rate: 1950, taxIds: [vat.id] }),
          createLineItem({ name: "Final report", description: "Written recommendations and implementation plan", quantity: 2, unit: "days", rate: 1450, taxIds: [vat.id] }),
        ],
        customFields: [
          { id: makeId("field"), label: "Engagement", value: "SOW-2026-02 Operations Review", visible: true, section: "invoice" },
        ],
        terms: "Late payment may incur statutory interest in line with the Late Payment of Commercial Debts (Interest) Act 1998.",
        settings: {
          ...createInvoice().settings,
          primaryColor: "#1d4ed8",
          fontFamily: "Times-Roman",
          showTerms: true,
          showColumn: {
            index: true, image: false, name: true, description: true, sku: false, hsn: false,
            quantity: true, unit: true, rate: true, discount: false, tax: true, amount: true,
          },
        },
      });
    },
  },
  {
    slug: "sales",
    name: "Sales invoice example",
    title: "Sales Invoice Example — Products with SKUs, Discount and Shipping",
    description:
      "A product sales invoice example with SKU column, a bulk discount, shipping charged separately, sales tax and a separate delivery address.",
    intro:
      "This is a sales invoice for physical goods. It shows the SKU column, a line-level bulk discount, shipping added as a taxable charge below the subtotal, and a delivery address that differs from the billing address.",
    notes: [
      "Each line carries a SKU so the buyer can reconcile the invoice against what physically arrived.",
      "The bulk discount is applied at line level, and tax is calculated on the discounted value — not the list price.",
      "Shipping is a charge rather than a line item, so it sits below the subtotal where buyers expect it.",
      "Ship-to differs from bill-to, which is common for trade orders.",
    ],
    fieldsIncluded: [
      "Seller business details",
      "Customer billing address",
      "Separate shipping address",
      "SKU per line item",
      "Line-level discount",
      "Sales tax breakdown",
      "Shipping charge",
    ],
    relatedTool: { href: "/sales-invoice-generator", label: "Sales invoice generator" },
    relatedGuide: { href: "/guides/invoice-discount-calculation", label: "How invoice discounts are calculated" },
    build: () => {
      const salesTax = createTax({ name: "Sales Tax", rate: 7.25, inclusive: false });
      return base({
        templateId: "retail",
        business: {
          name: "Beacon Supply Co.",
          email: "orders@beaconsupply.com",
          phone: "+1 503 555 0188",
          addressLine1: "1200 SE Water Ave, Unit 3",
          city: "Portland",
          state: "OR",
          postalCode: "97214",
          country: "United States",
        },
        customer: {
          name: "Dana Whitfield",
          company: "Harbor Point Cafe",
          email: "dana@harborpointcafe.com",
          billingAddress: "88 Commercial Street\nPortland, OR 97201",
          shipToDifferentAddress: true,
          shippingAddress: "Harbor Point Cafe — Receiving\n12 Dock Lane\nAstoria, OR 97103",
        },
        invoice: {
          number: "INV-5510",
          date: DATE,
          dueDate: DUE,
          documentTitle: "Invoice",
          currency: "USD",
          locale: "en-US",
          paymentTerms: "Net 14",
        },
        taxes: [salesTax],
        items: [
          createLineItem({ name: "Ceramic mug, 12oz", sku: "MUG-12-WHT", quantity: 120, unit: "pcs", rate: 6.5, discountValue: 10, discountType: "percentage", taxIds: [salesTax.id] }),
          createLineItem({ name: "Espresso tamper, 58mm", sku: "TMP-58-ST", quantity: 4, unit: "pcs", rate: 42, taxIds: [salesTax.id] }),
          createLineItem({ name: "Paper filter, box of 500", sku: "FLT-500", quantity: 16, unit: "box", rate: 18.75, taxIds: [salesTax.id] }),
        ],
        charges: [createCharge({ label: "Shipping", value: 48, type: "fixed", taxable: true, taxIds: [salesTax.id] })],
        settings: {
          ...createInvoice().settings,
          primaryColor: "#ea580c",
          tableStyle: "striped",
          showShipping: true,
          showColumn: {
            index: true, image: false, name: true, description: true, sku: true, hsn: false,
            quantity: true, unit: true, rate: true, discount: true, tax: true, amount: true,
          },
        },
      });
    },
  },
  {
    slug: "service",
    name: "Service invoice example",
    title: "Service Invoice Example — Services Rendered with Service Period",
    description:
      "A service invoice example for maintenance work, showing a service period, description-led line items and a deposit deducted as a negative line.",
    intro:
      "This is a service invoice for a monthly maintenance contract. It shows a stated service period, description-led line items, and a previously-paid deposit deducted as a negative line so the balance due is unambiguous.",
    notes: [
      "The service period is carried as a custom field — usually the first thing a client's finance team looks for.",
      "Descriptions carry the detail rather than the item names, which is typical for service work.",
      "The deposit already paid is deducted as a negative line, so the total is the balance actually owed.",
      "Tax applies to the services but the deposit line reduces the amount payable after it.",
    ],
    fieldsIncluded: [
      "Service provider details",
      "Client details",
      "Service period (custom field)",
      "Description-led line items",
      "Negative line for a deposit already paid",
      "Tax breakdown",
      "Payment terms and notes",
    ],
    relatedTool: { href: "/service-invoice-generator", label: "Service invoice generator" },
    relatedGuide: { href: "/guides/what-should-an-invoice-include", label: "What should an invoice include?" },
    build: () => {
      const vat = createTax({ name: "VAT", rate: 20, inclusive: false });
      return base({
        templateId: "service",
        business: {
          name: "Clearwater Facilities Services",
          email: "billing@clearwaterfs.co.uk",
          phone: "+44 161 555 0117",
          addressLine1: "Unit 9, Talbot Trade Park",
          city: "Manchester",
          postalCode: "M32 0FP",
          country: "United Kingdom",
          taxId: "GB 338 1192 47",
        },
        customer: {
          name: "Facilities Manager",
          company: "Lindley Court Management",
          email: "facilities@lindleycourt.co.uk",
          billingAddress: "Lindley Court\n4 Peel Avenue\nManchester M20 3RP",
        },
        invoice: {
          number: "CFS-3312",
          date: DATE,
          dueDate: DUE,
          documentTitle: "Invoice",
          currency: "GBP",
          locale: "en-GB",
          paymentTerms: "Payment due within 14 days",
        },
        taxes: [vat],
        items: [
          createLineItem({ name: "Planned maintenance visit", description: "Monthly inspection of HVAC, lighting and water systems across 4 floors", quantity: 1, unit: "visit", rate: 1240, taxIds: [vat.id] }),
          createLineItem({ name: "Reactive callout", description: "Emergency attendance 14 Feb — second floor water ingress", quantity: 3.5, unit: "hrs", rate: 78, taxIds: [vat.id] }),
          createLineItem({ name: "Replacement parts", description: "Pump seal kit and filters, supplied at cost", quantity: 1, unit: "job", rate: 186.4, taxIds: [vat.id] }),
          createLineItem({ name: "Less deposit received", description: "Paid 12 Feb 2026, ref DEP-3312", quantity: 1, unit: "", rate: -500 }),
        ],
        customFields: [
          { id: makeId("field"), label: "Service period", value: "1–29 February 2026", visible: true, section: "invoice" },
        ],
        notes: "Next scheduled visit: 28 March 2026.",
        settings: {
          ...createInvoice().settings,
          primaryColor: "#0d9488",
          showColumn: {
            index: true, image: false, name: true, description: true, sku: false, hsn: false,
            quantity: true, unit: true, rate: true, discount: false, tax: true, amount: true,
          },
        },
      });
    },
  },
  {
    slug: "contractor",
    name: "Contractor invoice example",
    title: "Contractor Invoice Example — Labour, Materials and Job Reference",
    description:
      "A contractor invoice example splitting labour and materials, referencing the job number and site, with a variation billed separately.",
    intro:
      "This is a contractor invoice for a completed job, splitting labour from materials and billing an authorised variation as its own line. It carries the job number and site address so it can be matched to the right cost code.",
    notes: [
      "Labour and materials are separate lines — clients accept a materials line at cost far more readily than one combined figure.",
      "The variation references the instruction that authorised it, which is what prevents it being queried.",
      "Job number and site address are custom fields, printed in the header area.",
      "Units reflect how the materials were actually purchased, not an abstract “1 × materials”.",
    ],
    fieldsIncluded: [
      "Contractor business details",
      "Client details",
      "Job number and site address (custom fields)",
      "Separate labour and materials lines",
      "Authorised variation line",
      "VAT breakdown",
      "Payment terms",
    ],
    relatedTool: { href: "/contractor-invoice-generator", label: "Contractor invoice generator" },
    relatedGuide: { href: "/guides/how-to-follow-up-on-unpaid-invoices", label: "Following up on unpaid invoices" },
    build: () => {
      const vat = createTax({ name: "VAT", rate: 20, inclusive: false });
      return base({
        templateId: "construction",
        business: {
          name: "Hollis & Sons Building Ltd",
          email: "accounts@hollisbuilding.co.uk",
          phone: "+44 113 555 0143",
          addressLine1: "Yard 2, Kirkstall Road",
          city: "Leeds",
          postalCode: "LS4 2AZ",
          country: "United Kingdom",
          taxId: "GB 229 4471 08",
        },
        customer: {
          name: "Sarah Brennan",
          company: "Brennan Property Group",
          billingAddress: "The Old Mill, Canal Wharf\nLeeds LS11 5PS",
        },
        invoice: {
          number: "HS-4188",
          date: DATE,
          dueDate: DUE,
          documentTitle: "Invoice",
          currency: "GBP",
          locale: "en-GB",
          paymentTerms: "Payment due within 14 days",
        },
        taxes: [vat],
        items: [
          createLineItem({ name: "Labour — groundworks", description: "Excavation, hardcore and formwork, 2 operatives", quantity: 64, unit: "hrs", rate: 38, taxIds: [vat.id] }),
          createLineItem({ name: "Ready-mix concrete C25", quantity: 9.5, unit: "m³", rate: 118, taxIds: [vat.id] }),
          createLineItem({ name: "Reinforcement mesh A252", quantity: 14, unit: "sheets", rate: 42.5, taxIds: [vat.id] }),
          createLineItem({ name: "Variation — additional drainage", description: "Per instruction VI-07 dated 18 Feb 2026", quantity: 1, unit: "job", rate: 1340, taxIds: [vat.id] }),
        ],
        customFields: [
          { id: makeId("field"), label: "Job no.", value: "J-2026-118", visible: true, section: "invoice" },
          { id: makeId("field"), label: "Site", value: "Canal Wharf, Plot 4", visible: true, section: "invoice" },
        ],
        settings: {
          ...createInvoice().settings,
          primaryColor: "#b45309",
          showColumn: {
            index: true, image: false, name: true, description: true, sku: false, hsn: false,
            quantity: true, unit: true, rate: true, discount: false, tax: true, amount: true,
          },
        },
      });
    },
  },
  {
    slug: "developer",
    name: "Developer invoice example",
    title: "Developer Invoice Example — Sprint Billing with Ticket References",
    description:
      "A software developer invoice example billing by sprint, referencing tickets, in USD with no tax — typical for cross-border contract work.",
    intro:
      "This is a developer invoice billed per sprint, with ticket references in the line descriptions so the client can trace each charge to work they have already reviewed. It is issued in USD to an overseas client with no tax applied.",
    notes: [
      "Lines map to sprints, which the client already tracks — making the invoice verifiable against their own board.",
      "Ticket references sit in the description rather than as forty separate lines.",
      "Infrastructure costs are passed through at cost as their own line, keeping the day rate legible.",
      "No tax is applied, which is typical for cross-border B2B services — check your own obligations.",
    ],
    fieldsIncluded: [
      "Developer business details",
      "Client company and address",
      "Sprint-based line items with ticket references",
      "Pass-through infrastructure costs at cost",
      "Invoice number, date and due date",
      "Payment link and bank details",
    ],
    relatedTool: { href: "/developer-invoice-generator", label: "Developer invoice generator" },
    relatedGuide: { href: "/guides/freelancer-invoice-guide", label: "The freelancer invoicing guide" },
    build: () =>
      base({
        templateId: "minimal",
        business: {
          name: "Rui Tavares",
          email: "rui@tavares.dev",
          addressLine1: "Rua das Flores 112, 3º",
          city: "Porto",
          postalCode: "4050-262",
          country: "Portugal",
        },
        customer: {
          name: "Engineering Operations",
          company: "Northstar Analytics Inc.",
          email: "ap@northstaranalytics.com",
          billingAddress: "500 Howard Street, Suite 400\nSan Francisco, CA 94105\nUnited States",
        },
        invoice: {
          number: "RT-2026-07",
          date: DATE,
          dueDate: DUE,
          documentTitle: "Invoice",
          currency: "USD",
          locale: "en-US",
          paymentTerms: "Net 14 — payable by bank transfer or Wise",
        },
        items: [
          createLineItem({ name: "Sprint 24", description: "Ingestion pipeline rewrite — NSA-418, NSA-422, NSA-431", quantity: 10, unit: "days", rate: 620 }),
          createLineItem({ name: "Sprint 25", description: "Query caching layer and benchmarks — NSA-440, NSA-447", quantity: 10, unit: "days", rate: 620 }),
          createLineItem({ name: "On-call support", description: "Two incidents outside sprint scope — NSA-452, NSA-455", quantity: 6.5, unit: "hrs", rate: 95 }),
          createLineItem({ name: "Infrastructure (pass-through)", description: "Staging cluster, billed at cost", quantity: 1, unit: "", rate: 214.8 }),
        ],
        payment: {
          paymentLink: "https://wise.com/pay/r/tavares-dev",
          instructions: "Bank details available on request; Wise preferred for USD transfers.",
        },
        settings: {
          ...createInvoice().settings,
          primaryColor: "#111827",
          tableStyle: "minimal",
          showColumn: {
            index: true, image: false, name: true, description: true, sku: false, hsn: false,
            quantity: true, unit: true, rate: true, discount: false, tax: false, amount: true,
          },
        },
      }),
  },
];

export function getExample(slug: string): InvoiceExample | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}
