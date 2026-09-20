/**
 * UI translations for the invoice editor.
 *
 * Scope is deliberate: this translates the *application chrome* the person
 * using the tool sees — tab names, field labels, buttons. It does not translate
 * the invoice document itself, because that audience is the user's customer,
 * not the user. Document wording is controlled separately and per-invoice
 * through editable labels (lib/invoice/labels.ts), so a German freelancer can
 * work in a German UI while issuing an English invoice, or the reverse.
 *
 * Marketing and SEO pages stay English and are not routed per-locale: serving
 * machine-translated content at /de/... would create thin duplicate pages,
 * which is the opposite of what the content strategy is for. Adding real
 * localised routes later is a separate, deliberate piece of work.
 *
 * `en` is the source of truth; every other locale is a Partial and falls back
 * key-by-key, so a missing translation shows English rather than a raw key.
 */

export const LOCALES = ["en", "hi", "de", "fr", "es"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<AppLocale, string> = {
  en: "English",
  hi: "हिन्दी",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
};

const en = {
  // Toolbar
  yourInvoice: "Your invoice",
  saving: "Saving…",
  savedLocally: "Saved in this browser",
  notSavedYet: "Not saved yet",
  newInvoice: "New",
  myTemplates: "My templates",
  downloadPdf: "Download PDF",
  downloadWord: "Download Word (.docx)",
  moreFormats: "More download formats",
  preparing: "Preparing…",
  print: "Print",

  // Tabs
  tabDetails: "Details",
  tabItems: "Items",
  tabTax: "Tax",
  tabPayment: "Payment",
  tabDesign: "Design",

  // Section headings
  yourBusiness: "Your business",
  billTo: "Bill to",
  invoiceDetails: "Invoice details",

  // Mobile toggle
  edit: "Edit",
  preview: "Preview",

  // Items
  addLineItem: "Add line item",
  details: "Details",
  images: "Images",

  // Site navigation
  navTemplates: "Templates",
  navExamples: "Examples",
  navGuides: "Guides",
  navBlog: "Blog",
  navCreateInvoice: "Create Free Invoice",

  // Common
  language: "Language",
} as const;

export type MessageKey = keyof typeof en;

const hi: Partial<Record<MessageKey, string>> = {
  yourInvoice: "आपका चालान",
  saving: "सहेजा जा रहा है…",
  savedLocally: "इस ब्राउज़र में सहेजा गया",
  notSavedYet: "अभी सहेजा नहीं गया",
  newInvoice: "नया",
  myTemplates: "मेरे टेम्पलेट",
  downloadPdf: "PDF डाउनलोड करें",
  downloadWord: "Word (.docx) डाउनलोड करें",
  moreFormats: "अन्य डाउनलोड प्रारूप",
  preparing: "तैयार किया जा रहा है…",
  print: "प्रिंट करें",
  tabDetails: "विवरण",
  tabItems: "मदें",
  tabTax: "कर",
  tabPayment: "भुगतान",
  tabDesign: "डिज़ाइन",
  yourBusiness: "आपका व्यवसाय",
  billTo: "प्राप्तकर्ता",
  invoiceDetails: "चालान विवरण",
  edit: "संपादित करें",
  preview: "पूर्वावलोकन",
  addLineItem: "मद जोड़ें",
  details: "विवरण",
  images: "छवियाँ",
  language: "भाषा",
  navTemplates: "टेम्पलेट",
  navExamples: "उदाहरण",
  navGuides: "मार्गदर्शिकाएँ",
  navBlog: "ब्लॉग",
  navCreateInvoice: "निःशुल्क चालान बनाएँ",
};

const de: Partial<Record<MessageKey, string>> = {
  yourInvoice: "Ihre Rechnung",
  saving: "Wird gespeichert…",
  savedLocally: "In diesem Browser gespeichert",
  notSavedYet: "Noch nicht gespeichert",
  newInvoice: "Neu",
  myTemplates: "Meine Vorlagen",
  downloadPdf: "PDF herunterladen",
  downloadWord: "Word (.docx) herunterladen",
  moreFormats: "Weitere Formate",
  preparing: "Wird vorbereitet…",
  print: "Drucken",
  tabDetails: "Details",
  tabItems: "Positionen",
  tabTax: "Steuer",
  tabPayment: "Zahlung",
  tabDesign: "Design",
  yourBusiness: "Ihr Unternehmen",
  billTo: "Rechnung an",
  invoiceDetails: "Rechnungsdetails",
  edit: "Bearbeiten",
  preview: "Vorschau",
  addLineItem: "Position hinzufügen",
  details: "Details",
  images: "Bilder",
  language: "Sprache",
  navTemplates: "Vorlagen",
  navExamples: "Beispiele",
  navGuides: "Anleitungen",
  navBlog: "Blog",
  navCreateInvoice: "Kostenlose Rechnung erstellen",
};

const fr: Partial<Record<MessageKey, string>> = {
  yourInvoice: "Votre facture",
  saving: "Enregistrement…",
  savedLocally: "Enregistré dans ce navigateur",
  notSavedYet: "Pas encore enregistré",
  newInvoice: "Nouveau",
  myTemplates: "Mes modèles",
  downloadPdf: "Télécharger le PDF",
  downloadWord: "Télécharger en Word (.docx)",
  moreFormats: "Autres formats",
  preparing: "Préparation…",
  print: "Imprimer",
  tabDetails: "Détails",
  tabItems: "Articles",
  tabTax: "Taxe",
  tabPayment: "Paiement",
  tabDesign: "Design",
  yourBusiness: "Votre entreprise",
  billTo: "Facturer à",
  invoiceDetails: "Détails de la facture",
  edit: "Modifier",
  preview: "Aperçu",
  addLineItem: "Ajouter une ligne",
  details: "Détails",
  images: "Images",
  language: "Langue",
  navTemplates: "Modèles",
  navExamples: "Exemples",
  navGuides: "Guides",
  navBlog: "Blog",
  navCreateInvoice: "Créer une facture gratuite",
};

const es: Partial<Record<MessageKey, string>> = {
  yourInvoice: "Tu factura",
  saving: "Guardando…",
  savedLocally: "Guardado en este navegador",
  notSavedYet: "Aún no guardado",
  newInvoice: "Nueva",
  myTemplates: "Mis plantillas",
  downloadPdf: "Descargar PDF",
  downloadWord: "Descargar Word (.docx)",
  moreFormats: "Más formatos",
  preparing: "Preparando…",
  print: "Imprimir",
  tabDetails: "Detalles",
  tabItems: "Artículos",
  tabTax: "Impuesto",
  tabPayment: "Pago",
  tabDesign: "Diseño",
  yourBusiness: "Tu empresa",
  billTo: "Facturar a",
  invoiceDetails: "Detalles de la factura",
  edit: "Editar",
  preview: "Vista previa",
  addLineItem: "Añadir línea",
  details: "Detalles",
  images: "Imágenes",
  language: "Idioma",
  navTemplates: "Plantillas",
  navExamples: "Ejemplos",
  navGuides: "Guías",
  navBlog: "Blog",
  navCreateInvoice: "Crear factura gratis",
};

const MESSAGES: Record<AppLocale, Partial<Record<MessageKey, string>>> = { en, hi, de, fr, es };

/** Translate `key`, falling back to English for any untranslated string. */
export function translate(locale: AppLocale, key: MessageKey): string {
  return MESSAGES[locale]?.[key] ?? en[key];
}

export function isAppLocale(value: string): value is AppLocale {
  return (LOCALES as readonly string[]).includes(value);
}
