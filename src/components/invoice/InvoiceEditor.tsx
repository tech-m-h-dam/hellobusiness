"use client";

/**
 * The invoice editor — the client island that the otherwise-static pages mount.
 *
 * Desktop: editor column beside a live preview.
 * Mobile:  a single column with an Edit/Preview toggle (spec section 37).
 *
 * Everything in here runs offline after first load: state is local, totals are
 * computed in-process, images are processed in-browser, persistence is
 * IndexedDB, and the PDF is generated client-side. No network request is made
 * while creating an invoice.
 */
import { useEffect, useState } from "react";
import { Cloud, Eye, FileText, HelpCircle, Loader2, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { applyTemplatePreset } from "@/lib/invoice/templates";
import { track } from "@/lib/analytics/track";
import { BusinessForm } from "./editor/BusinessForm";
import { CustomerForm } from "./editor/CustomerForm";
import { InvoiceDetailsForm } from "./editor/InvoiceDetailsForm";
import { ItemsEditor } from "./editor/ItemsEditor";
import { TaxesChargesForm } from "./editor/TaxesChargesForm";
import { PaymentNotesForm } from "./editor/PaymentNotesForm";
import { DesignPanel } from "./editor/DesignPanel";
import { InvoicePreview } from "./InvoicePreview";
import { DownloadButton } from "./DownloadButton";
import { SaveToAccountPrompt } from "./SaveToAccountPrompt";
import { SaveTemplateDialog } from "./editor/SaveTemplateDialog";
import { FeatureTour, restartTour } from "./FeatureTour";
import { useT } from "@/lib/i18n/use-locale";

type Props = {
  /** Pre-applied template for type-specific landing pages (e.g. the GST page). */
  initialTemplateId?: string;
  /** Column/section defaults for a specific invoice type, merged on first mount. */
  initialSettings?: Partial<import("@/lib/invoice/types").InvoiceSettings>;
  /** Invoice defaults (currency, locale, title) for a specific invoice type. */
  initialMeta?: Partial<import("@/lib/invoice/types").InvoiceMeta>;
  /**
   * Whether optional Google sign-in is configured on this deployment. Passed
   * down from the server so the post-download save prompt is never rendered
   * (and never calls /api/auth/session) on a deployment without OAuth.
   */
  authAvailable?: boolean;
};

export function InvoiceEditor({
  initialTemplateId,
  initialSettings,
  initialMeta,
  authAvailable = false,
}: Props) {
  const hydrated = useInvoiceEditor((s) => s.hydrated);
  const saving = useInvoiceEditor((s) => s.saving);
  const lastSavedAt = useInvoiceEditor((s) => s.lastSavedAt);
  const hydrateFromDraft = useInvoiceEditor((s) => s.hydrateFromDraft);
  const update = useInvoiceEditor((s) => s.update);
  const reset = useInvoiceEditor((s) => s.reset);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  // Shown after a successful download, or on demand via the toolbar CTA;
  // dismissible for the session either way.
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const t = useT();

  // Restore the in-progress draft, then apply any page-specific defaults.
  useEffect(() => {
    void hydrateFromDraft().then(() => {
      if (initialTemplateId || initialSettings || initialMeta) {
        update((inv) => ({
          ...inv,
          templateId: initialTemplateId ?? inv.templateId,
          settings: {
            ...(initialTemplateId ? applyTemplatePreset(inv.settings, initialTemplateId) : inv.settings),
            ...initialSettings,
          },
          invoice: { ...inv.invoice, ...initialMeta },
        }));
      }
      track("invoice_started");
    });
    // Intentionally run once: this is first-mount hydration, not a sync effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-xl border border-ink-200 bg-white">
        <Loader2 className="size-5 animate-spin text-ink-400" />
        <span className="sr-only">Loading your invoice editor…</span>
      </div>
    );
  }

  const editorPanel = (
    <div className="space-y-4">
      <Tabs defaultValue="details">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="details">{t("tabDetails")}</TabsTrigger>
          <TabsTrigger value="items">{t("tabItems")}</TabsTrigger>
          <TabsTrigger value="tax">{t("tabTax")}</TabsTrigger>
          <TabsTrigger value="payment">{t("tabPayment")}</TabsTrigger>
          <TabsTrigger value="design" data-tour="design">
            {t("tabDesign")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink-900">{t("yourBusiness")}</h2>
            <BusinessForm />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink-900">{t("billTo")}</h2>
            <CustomerForm />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink-900">{t("invoiceDetails")}</h2>
            <InvoiceDetailsForm />
          </section>
        </TabsContent>

        <TabsContent value="items">
          <ItemsEditor />
        </TabsContent>

        <TabsContent value="tax">
          <TaxesChargesForm />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentNotesForm />
        </TabsContent>

        <TabsContent value="design">
          <DesignPanel />
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="w-full">
      <FeatureTour />

      {/* Toolbar ----------------------------------------------------------- */}
      {/*
       * Stacks on small screens rather than wrapping. At phone width the
       * secondary controls and a fixed-width download block could not share a
       * row: the row overflowed horizontally, which pushed the language and
       * template pickers partly off-screen and left their dropdowns
       * unreachable. Rows here, columns from `sm` up.
       */}
      <div
        data-print="hide"
        className="mb-4 flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-center gap-2 text-sm text-ink-600">
          <FileText className="size-4 shrink-0 text-brand-600" />
          <span className="font-medium text-ink-900">{t("yourInvoice")}</span>
          <span aria-live="polite" className="text-[12px] text-ink-500">
            {saving ? t("saving") : lastSavedAt ? t("savedLocally") : t("notSavedYet")}
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
          <div className="flex flex-wrap items-center gap-2">
            <SaveTemplateDialog />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={restartTour}
              aria-label="Replay the feature tour"
            >
              <HelpCircle />
              <span className="hidden sm:inline">Tour</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Start a new invoice? Your current draft in this browser will be cleared.")) {
                  reset();
                }
              }}
            >
              <RotateCcw /> {t("newInvoice")}
            </Button>
          </div>
          {authAvailable && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowSavePrompt(true)}>
              <Cloud /> {t("saveInvoice")}
            </Button>
          )}
          <div className="w-full sm:w-auto sm:min-w-64" data-tour="download">
            <DownloadButton onDownloaded={() => setShowSavePrompt(authAvailable)} />
          </div>
        </div>
      </div>

      {showSavePrompt && authAvailable && (
        <div className="mb-4">
          <SaveToAccountPrompt onDismiss={() => setShowSavePrompt(false)} />
        </div>
      )}

      {/* Mobile toggle ------------------------------------------------------ */}
      <div data-print="hide" className="mb-3 flex gap-2 lg:hidden">
        <Button
          type="button"
          variant={mobileView === "edit" ? "primary" : "secondary"}
          size="sm"
          className="flex-1"
          onClick={() => setMobileView("edit")}
          aria-pressed={mobileView === "edit"}
        >
          <Pencil /> {t("edit")}
        </Button>
        <Button
          type="button"
          variant={mobileView === "preview" ? "primary" : "secondary"}
          size="sm"
          className="flex-1"
          onClick={() => setMobileView("preview")}
          aria-pressed={mobileView === "preview"}
        >
          <Eye /> {t("preview")}
        </Button>
      </div>

      <div // Editor 60 / preview 40, so the document is comfortably readable without
        // squeezing the form it is being filled in from.
        className="grid gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
        <div
          data-print="hide"
          // Stable hook for tests: the document now exposes click-to-edit
          // controls with the same accessible names as these form fields, so
          // assertions need a way to say which of the two they mean.
          data-editor-panel
          className={`min-w-0 overflow-x-hidden rounded-xl border border-ink-200 bg-white p-3 sm:p-4 ${mobileView === "edit" ? "" : "hidden lg:block"}`}
        >
          {editorPanel}
        </div>

        <div className={`min-w-0 lg:sticky lg:top-20 lg:self-start ${mobileView === "preview" ? "" : "hidden lg:block"}`}>
          <InvoicePreview />
        </div>
      </div>
    </div>
  );
}
