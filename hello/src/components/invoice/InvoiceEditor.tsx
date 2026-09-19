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
import { Eye, FileText, Loader2, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvoiceEditor } from "@/stores/invoice-editor";
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

type Props = {
  /** Pre-applied template for type-specific landing pages (e.g. the GST page). */
  initialTemplateId?: string;
  /** Column/section defaults for a specific invoice type, merged on first mount. */
  initialSettings?: Partial<import("@/lib/invoice/types").InvoiceSettings>;
};

export function InvoiceEditor({ initialTemplateId, initialSettings }: Props) {
  const hydrated = useInvoiceEditor((s) => s.hydrated);
  const saving = useInvoiceEditor((s) => s.saving);
  const lastSavedAt = useInvoiceEditor((s) => s.lastSavedAt);
  const hydrateFromDraft = useInvoiceEditor((s) => s.hydrateFromDraft);
  const update = useInvoiceEditor((s) => s.update);
  const reset = useInvoiceEditor((s) => s.reset);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  // Only ever shown after a successful download, and dismissible for the session.
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  // Restore the in-progress draft, then apply any page-specific defaults.
  useEffect(() => {
    void hydrateFromDraft().then(() => {
      if (initialTemplateId || initialSettings) {
        update((inv) => ({
          ...inv,
          templateId: initialTemplateId ?? inv.templateId,
          settings: { ...inv.settings, ...initialSettings },
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
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Your business</h2>
            <BusinessForm />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Bill to</h2>
            <CustomerForm />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Invoice details</h2>
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
      {/* Toolbar ----------------------------------------------------------- */}
      <div
        data-print="hide"
        className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white p-3"
      >
        <div className="flex items-center gap-2 text-sm text-ink-600">
          <FileText className="size-4 text-brand-600" />
          <span className="font-medium text-ink-900">Your invoice</span>
          <span aria-live="polite" className="text-[12px] text-ink-500">
            {saving ? "Saving…" : lastSavedAt ? "Saved in this browser" : "Not saved yet"}
          </span>
        </div>

        <div className="flex items-center gap-2">
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
            <RotateCcw /> New
          </Button>
          <div className="w-56">
            <DownloadButton onDownloaded={() => setShowSavePrompt(true)} />
          </div>
        </div>
      </div>

      {showSavePrompt && (
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
          <Pencil /> Edit
        </Button>
        <Button
          type="button"
          variant={mobileView === "preview" ? "primary" : "secondary"}
          size="sm"
          className="flex-1"
          onClick={() => setMobileView("preview")}
          aria-pressed={mobileView === "preview"}
        >
          <Eye /> Preview
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div
          data-print="hide"
          className={`rounded-xl border border-ink-200 bg-white p-4 ${mobileView === "edit" ? "" : "hidden lg:block"}`}
        >
          {editorPanel}
        </div>

        <div className={`lg:sticky lg:top-20 lg:self-start ${mobileView === "preview" ? "" : "hidden lg:block"}`}>
          <InvoicePreview />
        </div>
      </div>
    </div>
  );
}
